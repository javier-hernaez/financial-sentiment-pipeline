"""Warehouse behaviour: schema lifecycle, the Gold view, table browsing and concurrent access."""

import threading

import duckdb
import polars as pl
import pytest

from src.storage import BronzeDataLake, MarketWarehouse


def _candle(hour: str, asset: str = "BTCUSDT", open_ms: int = 1) -> dict:
    return {
        "source": "binance",
        "asset_ticker": asset,
        "interval": "1h",
        "timestamp_open_ms": open_ms,
        "timestamp_close_ms": open_ms + 1,
        "datetime_open_utc": "2026-09-07T12:00:00+00:00",
        "datetime_close_utc": "2026-09-07T12:59:59+00:00",
        "timestamp_hour": hour,
        "open_price": 100.0,
        "high_price": 110.0,
        "low_price": 90.0,
        "close_price": 105.0,
        "volume": 1.0,
        "quote_volume": 1.0,
        "trades_count": 1,
    }


def _post(post_id: str, hour: str, asset: str, score: float, label: str, title: str = "t") -> dict:
    return {
        "source": "rss",
        "post_id": post_id,
        "subreddit": "x",
        "asset_ticker": asset,
        "title": title,
        "cleaned_text": title,
        "author": None,
        "upvotes": 0,
        "upvote_ratio": 1.0,
        "num_comments": 0,
        "created_utc": "2026-09-07T12:30:00+00:00",
        "timestamp_hour": hour,
        "sentiment_score": score,
        "sentiment_label": label,
        "confidence": 0.9,
    }


HOUR = "2026-09-07 12:00:00"


def _gold_row(warehouse: MarketWarehouse, asset: str) -> dict:
    return warehouse.query_gold(symbol=asset, limit=1).to_dicts()[0]


def test_schema_runs_once_per_connection(monkeypatch):
    # It used to run on every instance, so on every API read, taking catalog locks each time
    calls = []
    original = MarketWarehouse.init_schema
    monkeypatch.setattr(MarketWarehouse, "init_schema", staticmethod(lambda conn: (calls.append(1), original(conn))))

    for _ in range(5):
        MarketWarehouse().close()

    assert len(calls) == 1


def test_instances_share_committed_data_and_close_independently():
    first = MarketWarehouse()
    second = MarketWarehouse()
    first.upsert_market_prices(pl.DataFrame([_candle(HOUR)]))
    first.close()
    assert len(second.query_gold()) == 1
    second.close()


def test_private_database_gets_its_own_connection(tmp_path):
    with MarketWarehouse(db_path=tmp_path / "private.duckdb") as warehouse:
        assert warehouse.isolated
        warehouse.upsert_market_prices(pl.DataFrame([_candle(HOUR)]))
    assert MarketWarehouse._shared_connections == {}


def test_old_databases_are_upgraded(tmp_path):
    path = tmp_path / "old.duckdb"
    con = duckdb.connect(str(path))
    con.execute(
        "CREATE TABLE silver_social_sentiment (post_id VARCHAR PRIMARY KEY, title VARCHAR, timestamp_hour VARCHAR, "
        "sentiment_score DOUBLE, sentiment_label VARCHAR)"
    )
    con.close()

    with MarketWarehouse(db_path=path) as warehouse:
        columns = {r[0] for r in warehouse.conn.execute("DESCRIBE silver_social_sentiment").fetchall()}
    assert {"ingested_at", "asset_ticker"} <= columns


def test_gold_hour_without_mentions_has_no_sentiment():
    # GREATEST and LEAST skip NULLs, so an unguarded index turned these hours into 'Extreme Greed'. They also used
    # to report 0.0, 50 and 'Neutral', which nobody measured.
    with MarketWarehouse() as warehouse:
        warehouse.upsert_market_prices(pl.DataFrame([_candle(HOUR)]))
        row = _gold_row(warehouse, "BTCUSDT")
    assert row["social_volume_mentions"] == 0
    assert row["avg_hourly_sentiment"] is None
    assert row["fear_and_greed_score"] is None
    assert row["finbert_sentiment_index"] is None
    assert row["fear_and_greed_classification"] is None


def test_silver_keeps_the_engine_and_drops_votes_from_old_bronze_files():
    with MarketWarehouse() as warehouse:
        post = _post("a", HOUR, "BTCUSDT", 0.5, "bullish") | {"upvotes": 120, "upvote_ratio": 0.95, "num_comments": 18}
        warehouse.upsert_social_sentiment(pl.DataFrame([post | {"nlp_engine": "heuristic"}]))
        warehouse.upsert_social_sentiment(pl.DataFrame([_post("b", HOUR, "BTCUSDT", 0.5, "bullish")]))
        rows = warehouse.conn.execute(
            "SELECT upvotes, upvote_ratio, num_comments, nlp_engine FROM silver_social_sentiment ORDER BY post_id"
        ).fetchall()
        counts = warehouse.nlp_engine_counts()
    assert rows == [(None, None, None, "heuristic"), (None, None, None, None)]
    assert counts == {"heuristic": 1, "unknown": 1}


def test_gold_counts_asset_news_and_market_wide_news_but_not_other_assets():
    with MarketWarehouse() as warehouse:
        warehouse.upsert_market_prices(pl.DataFrame([_candle(HOUR, "BTCUSDT", 1), _candle(HOUR, "ETHUSDT", 2)]))
        warehouse.upsert_social_sentiment(
            pl.DataFrame(
                [
                    _post("a", HOUR, "BTCUSDT", 0.8, "bullish"),
                    _post("b", HOUR, "ALL", 0.4, "bullish"),
                    _post("c", HOUR, "ETHUSDT", -0.6, "bearish"),
                    _post("d", "2026-09-07 13:00:00", "BTCUSDT", 1.0, "bullish"),
                ]
            )
        )
        btc = _gold_row(warehouse, "BTCUSDT")
        eth = _gold_row(warehouse, "ETHUSDT")

    assert btc["social_volume_mentions"] == 2
    assert btc["bullish_mentions"] == 2
    assert btc["avg_hourly_sentiment"] == pytest.approx(0.6)
    assert btc["fear_and_greed_score"] == 80
    assert btc["fear_and_greed_classification"] == "Extreme Greed"

    assert eth["social_volume_mentions"] == 2
    assert eth["bearish_mentions"] == 1
    assert eth["avg_hourly_sentiment"] == pytest.approx(-0.1)
    assert eth["fear_and_greed_classification"] == "Neutral"


@pytest.mark.parametrize(
    "score, label",
    [(-0.6, "Extreme Fear"), (-0.2, "Fear"), (0.05, "Neutral"), (0.4, "Greed"), (0.7, "Extreme Greed")],
)
def test_gold_classification_thresholds(score, label):
    with MarketWarehouse() as warehouse:
        warehouse.upsert_market_prices(pl.DataFrame([_candle(HOUR)]))
        warehouse.upsert_social_sentiment(pl.DataFrame([_post("a", HOUR, "BTCUSDT", score, "neutral")]))
        assert _gold_row(warehouse, "BTCUSDT")["fear_and_greed_classification"] == label


def test_browse_table_filters_pages_and_counts():
    posts = [_post(f"p{i}", HOUR, "BTCUSDT", 0.1, "neutral", title=f"Bitcoin story {i}") for i in range(5)]
    posts.append(_post("other", HOUR, "ETHUSDT", 0.1, "neutral", title="Ether story"))
    with MarketWarehouse() as warehouse:
        warehouse.upsert_social_sentiment(pl.DataFrame(posts))

        page = warehouse.browse_table("silver_social_sentiment", limit=2, offset=0, search="bitcoin")
        assert page["total_count"] == 5
        assert len(page["rows"]) == 2

        by_asset = warehouse.browse_table("silver_social_sentiment", limit=10, offset=0, asset="ETHUSDT")
        assert [r["post_id"] for r in by_asset["rows"]] == ["other"]

        # This table has no asset column, so the filter does not apply rather than failing
        runs = warehouse.browse_table("pipeline_runs", limit=10, offset=0, asset="ETHUSDT")
        assert runs["total_count"] == 0


def test_reads_do_not_conflict_with_a_writer():
    # Reads used to run DDL, which conflicts with concurrent writes ('Catalog write-write conflict')
    errors: list[Exception] = []
    stop = threading.Event()
    with MarketWarehouse() as writer:
        writer.upsert_market_prices(pl.DataFrame([_candle(HOUR)]))

        def read() -> None:
            while not stop.is_set():
                try:
                    with MarketWarehouse() as warehouse:
                        warehouse.query_gold(limit=5)
                        warehouse.describe_tables()
                except Exception as exc:
                    errors.append(exc)
                    return

        readers = [threading.Thread(target=read) for _ in range(4)]
        for thread in readers:
            thread.start()
        for i in range(30):
            writer.upsert_market_prices(pl.DataFrame([_candle(HOUR, open_ms=i + 10)]))
        stop.set()
        for thread in readers:
            thread.join()

    assert errors == []


def test_lake_reads_never_mix_symbols(tmp_path):
    # A symbol without files used to fall back to the whole source, reprocessing other assets
    lake = BronzeDataLake(base_dir=tmp_path)
    lake.write_raw_records("market", [{"asset_ticker": "BTCUSDT"}], symbol="BTCUSDT")
    assert lake.read_partitions("market", symbol="ETHUSDT") is None
    assert len(lake.read_partitions("market", symbol="BTCUSDT")) == 1


def test_lake_keeps_the_newest_files_and_aligns_their_columns(tmp_path):
    lake = BronzeDataLake(base_dir=tmp_path)
    lake.write_raw_records("social", [{"id": 1}])
    lake.write_raw_records("social", [{"id": 2, "extra": "x"}])
    lake.write_raw_records("social", [{"id": 3, "extra": "y"}])

    assert sorted(lake.read_partitions("social", max_files=2)["id"].to_list()) == [2, 3]
    assert set(lake.read_partitions("social").columns) == {"id", "extra"}


def test_lake_skips_unreadable_files(tmp_path):
    lake = BronzeDataLake(base_dir=tmp_path)
    good = lake.write_raw_records("social", [{"id": 1}])
    (good.parent / "broken.parquet").write_bytes(b"not parquet")

    assert lake.read_partitions("social")["id"].to_list() == [1]


def test_lake_inventory_lists_files_newest_first(tmp_path):
    lake = BronzeDataLake(base_dir=tmp_path)
    assert BronzeDataLake(base_dir=tmp_path / "empty").inventory() == []

    lake.write_raw_records("market", [{"id": 1}], symbol="BTCUSDT")
    lake.write_raw_records("social", [{"id": 2}])

    files = lake.inventory()
    assert {f["source"] for f in files} == {"market", "social"}
    market = next(f for f in files if f["source"] == "market")
    assert market["partition"].startswith("BTCUSDT/year=")
    assert market["path"].startswith("market/BTCUSDT/")
    assert files == sorted(files, key=lambda f: f["modified_utc"], reverse=True)
