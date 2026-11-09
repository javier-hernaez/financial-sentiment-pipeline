"""FinBERT batching with a stand-in model, news feed edge cases, project facts and the CLI."""

from types import SimpleNamespace

import httpx
import polars as pl
import pytest

from src import main as cli
from src.dashboard import project_facts
from src.extractors.social_reddit import SocialRedditExtractor
from src.nlp.finbert_engine import FinBERTEngine
from src.pipeline.orchestrator import MarketIntelligencePipeline


class _Tokenizer:
    """Encodes each text as its length, which is what the stand-in model classifies by."""

    def __init__(self):
        self.batches: list[list[str]] = []

    def __call__(self, texts, **kwargs):
        import torch

        self.batches.append(list(texts))
        return {"lengths": torch.tensor([float(len(t)) for t in texts])}


class _Model:
    """Class order deliberately differs from ProsusAI/finbert's. Long texts are negative, short ones positive."""

    config = SimpleNamespace(id2label={0: "NEGATIVE", 1: "neutral", 2: "positive"})

    def __call__(self, lengths):
        import torch

        negative = (lengths > 10).float() * 10
        positive = (lengths <= 10).float() * 10
        return SimpleNamespace(logits=torch.stack([negative, torch.zeros_like(lengths), positive], dim=-1))


@pytest.fixture
def engine():
    pytest.importorskip("torch")
    instance = FinBERTEngine(force_mock=True, batch_size=2)
    instance.force_mock = False
    instance.tokenizer = _Tokenizer()
    instance.model = _Model()
    instance._label_indices = {"positive": 2, "negative": 0, "neutral": 1}
    return instance


def test_transformer_results_keep_input_order_and_skip_blank_texts(engine):
    texts = ["a much longer headline", "", "short", "   ", "another long headline here", "tiny"]

    predictions = engine.predict_batch(texts)

    assert [p["sentiment_label"] for p in predictions] == [
        "bearish",
        None,
        "bullish",
        None,
        "bearish",
        "bullish",
    ]
    assert all(p["engine_mode"] == "transformer" for p in predictions)
    # A blank text in a mixed batch used to go through the model, which answers something meaningless
    assert predictions[1]["sentiment_score"] is None
    assert not any(not t.strip() for batch in engine.tokenizer.batches for t in batch)


def test_transformer_batches_group_similar_lengths(engine):
    engine.predict_batch(["x" * 50, "y", "z" * 40, "w"])
    assert engine.tokenizer.batches == [["y", "w"], ["z" * 40, "x" * 50]]


def test_engine_without_a_model_falls_back_and_says_so(monkeypatch):
    monkeypatch.setattr(FinBERTEngine, "_try_load_model", lambda self: None)
    engine = FinBERTEngine(force_mock=False)
    engine.force_mock = False

    assert engine.engine_mode == "heuristic"
    assert engine.predict_batch(["Bitcoin crash"])[0]["engine_mode"] == "heuristic"
    assert engine.predict_batch([]) == []


def test_pipeline_loads_the_model_only_when_there_is_something_to_score():
    loads = []

    def provider():
        loads.append(1)
        return FinBERTEngine(force_mock=True)

    pipeline = MarketIntelligencePipeline(symbol="BTCUSDT", hours=1, nlp_provider=provider)
    pipeline.transform_silver(raw_market=[], raw_social=[])
    assert loads == []

    post = {
        "source": "rss",
        "post_id": "p1",
        "subreddit": "x",
        "asset_ticker": "BTCUSDT",
        "title": "Bitcoin surges",
        "text_body": "",
        "author": None,
        "upvotes": 0,
        "upvote_ratio": 1.0,
        "num_comments": 0,
        "created_utc": "2026-09-07T12:30:00+00:00",
        "timestamp_hour": "2026-09-07 12:00:00",
    }
    result = pipeline.transform_silver(raw_market=[], raw_social=[post])
    assert loads == [1]
    assert result["total_silver_social"] == 1

    # The same story again finds nothing new to score
    again = pipeline.transform_silver(raw_market=[], raw_social=[post])
    assert loads == [1]
    assert again["total_silver_social"] == 1
    pipeline.close()


XXE_FEED = """<?xml version="1.0"?>
<!DOCTYPE rss [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<rss><channel><item><title>&xxe;</title></item></channel></rss>"""


async def test_hostile_or_broken_feeds_are_skipped():
    extractor = SocialRedditExtractor()
    answers = {
        "bad": "<rss><channel>",
        "xxe": XXE_FEED,
        "ok": "<rss><channel><item><title>Fine</title></item></channel></rss>",
    }

    def handler(request):
        if request.url.host == "down.test":
            raise httpx.ConnectError("down")
        if request.url.host == "gone.test":
            return httpx.Response(404)
        return httpx.Response(200, text=answers[request.url.host.split(".")[0]])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:

        async def fetch(host):
            return await extractor._fetch_posts(
                client, f"http://{host}/", host, lambda text: extractor.parse_rss(text, "src")
            )

        assert await fetch("bad.test") == []
        assert await fetch("xxe.test") == []
        assert await fetch("down.test") == []
        assert await fetch("gone.test") == []
        assert [p["title"] for p in await fetch("ok.test")] == ["Fine"]


async def test_news_extraction_combines_sources_and_one_failure_does_not_stop_it(monkeypatch):
    def handler(request):
        host = request.url.host
        if host == "www.reddit.com":
            return httpx.Response(429)
        if host == "news.google.com":
            title = "Bitcoin price story - CoinDesk"
            return httpx.Response(
                200,
                text=f"<rss><channel><item><title>{title}</title><source>CoinDesk</source></item></channel></rss>",
            )
        if host == "cointelegraph.com":
            return httpx.Response(
                200, text="<rss><channel><item><title>Solana outage ends</title><guid>1</guid></item></channel></rss>"
            )
        return httpx.Response(500)

    extractor = SocialRedditExtractor(lookback_hours=24)
    extractor._client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    posts = await extractor.extract()
    await extractor.close()

    assert {p["title"] for p in posts} == {"Solana outage ends", "Bitcoin price story"}


@pytest.mark.parametrize(
    "date, hour",
    [
        ("<pubDate>Sun, 08 Nov 2026 09:14:27 GMT</pubDate>", "2026-11-08 09:00:00"),
        ("<pubDate>2026-11-08T09:14:27Z</pubDate>", "2026-11-08 09:00:00"),
        ("<pubDate>2026-11-08T11:14:27+02:00</pubDate>", "2026-11-08 09:00:00"),
        ("<pubDate>2026-11-08T09:14:27</pubDate>", "2026-11-08 09:00:00"),
    ],
)
def test_feed_dates_are_read_in_utc(date, hour):
    feed = f"<rss><channel><item><title>Story</title>{date}</item></channel></rss>"
    assert SocialRedditExtractor.parse_rss(feed, "src")[0]["timestamp_hour"] == hour


_REAL_ASYNC_CLIENT = httpx.AsyncClient


def _route_httpx(monkeypatch, handler):
    def client_with_mock(**kwargs):
        return _REAL_ASYNC_CLIENT(transport=httpx.MockTransport(handler), **kwargs)

    monkeypatch.setattr(project_facts.httpx, "AsyncClient", client_with_mock)


async def test_binance_health_accepts_a_working_mirror(monkeypatch):
    _route_httpx(
        monkeypatch,
        lambda request: httpx.Response(451 if request.url.host == "api.binance.com" else 200, json={}),
    )
    health = await project_facts.binance_health()
    assert health["status"] == 200
    assert health["latency_ms"] >= 0


async def test_binance_health_reports_when_nothing_answers_and_caches_it(monkeypatch):
    calls = []

    def handler(request):
        calls.append(request.url.host)
        raise httpx.ConnectError("down")

    _route_httpx(monkeypatch, handler)
    first = await project_facts.binance_health()
    second = await project_facts.binance_health()

    assert first == second == {"status": 503, "latency_ms": -1, "error": "ConnectError"}
    assert len(calls) == 2  # both hosts, once: the second call came from the cache


async def test_latest_ci_run_is_parsed_and_tolerates_failures(monkeypatch):
    run = {
        "name": "CI",
        "status": "completed",
        "conclusion": "success",
        "head_branch": "main",
        "head_sha": "abcdef1234",
    }
    _route_httpx(monkeypatch, lambda request: httpx.Response(200, json={"workflow_runs": [run]}))
    assert (await project_facts.latest_ci_run())["commit"] == "abcdef1"

    project_facts.latest_ci_run.cache_clear()
    _route_httpx(monkeypatch, lambda request: httpx.Response(403, json={}))
    assert await project_facts.latest_ci_run() is None

    project_facts.latest_ci_run.cache_clear()

    def down(request):
        raise httpx.ConnectError("down")

    _route_httpx(monkeypatch, down)
    assert await project_facts.latest_ci_run() is None


def test_project_facts_handle_a_missing_repository(tmp_path):
    assert project_facts.count_tests(tmp_path / "nope") is None
    assert project_facts.read_ci_config(tmp_path / "nope.yml") is None

    (tmp_path / "test_broken.py").write_text("def (", encoding="utf-8")
    (tmp_path / "test_ok.py").write_text("def test_a(): pass\nasync def test_b(): pass\n", encoding="utf-8")
    assert project_facts.count_tests(tmp_path) == {"total": 2, "files": [{"file": "test_ok.py", "tests": 2}]}


def test_count_tests_expands_parametrized_cases(tmp_path):
    (tmp_path / "test_cases.py").write_text(
        "import pytest\n"
        "@pytest.mark.parametrize('a', [1, 2, 3])\n"
        "@pytest.mark.parametrize('b', (1, 2))\n"
        "def test_grid(a, b): pass\n"
        "@pytest.mark.parametrize('c', VALUES)\n"
        "def test_not_literal(c): pass\n"
        "def test_plain(): pass\n",
        encoding="utf-8",
    )
    assert project_facts.count_tests(tmp_path)["total"] == 8


class _FakePipeline:
    outcome: dict | Exception = {}

    def __init__(self, **kwargs):
        self.kwargs = kwargs

    async def run(self):
        if isinstance(self.outcome, Exception):
            raise self.outcome
        return self.outcome


async def test_cli_reports_success(monkeypatch, capsys):
    gold = pl.DataFrame(
        {
            "timestamp_hour": ["2026-01-01 00:00:00"],
            "asset_ticker": ["BTCUSDT"],
            "close_price": [100.0],
            "volume": [1.0],
            "avg_hourly_sentiment": [0.5],
            "social_volume_mentions": [2],
            "bullish_mentions": [2],
            "bearish_mentions": [0],
            "neutral_mentions": [0],
            "fear_and_greed_score": [75],
            "fear_and_greed_classification": ["Greed"],
        }
    )
    _FakePipeline.outcome = {"gold_preview": gold, "candles_processed": 1, "posts_processed": 2, "elapsed_seconds": 0.5}
    monkeypatch.setattr(cli, "MarketIntelligencePipeline", _FakePipeline)

    assert await cli.main_async(["--symbol", "ETHUSDT", "--hours", "2", "--mock-nlp"]) == 0
    assert "Success!" in capsys.readouterr().out


async def test_cli_returns_an_error_code_on_failure(monkeypatch):
    _FakePipeline.outcome = RuntimeError("boom")
    monkeypatch.setattr(cli, "MarketIntelligencePipeline", _FakePipeline)
    assert await cli.main_async([]) == 1


def test_cli_table_handles_no_data(capsys):
    cli.display_gold_table(None)
    cli.display_gold_table(pl.DataFrame())
    assert capsys.readouterr().out.count("No gold records") == 2
