"""Binance REST API Kline (OHLCV) Extractor."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..configs.settings import settings
from .base import BaseAsyncExtractor


class BinanceKlinesExtractor(BaseAsyncExtractor):
    """Extractor for high-frequency OHLCV candles from Binance public API."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        symbol: Optional[str] = None,
        interval: Optional[str] = None,
    ):
        base_url = base_url or settings.binance_base_url
        super().__init__(name="BinanceKlines", base_url=base_url)
        self.symbol = symbol or settings.default_symbol
        self.interval = interval or settings.default_interval

    async def extract(
        self,
        symbol: Optional[str] = None,
        interval: Optional[str] = None,
        limit: int = 24,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Extracts OHLCV candles from /api/v3/klines.

        :param symbol: Trading pair ticker (e.g., BTCUSDT).
        :param interval: Candle timeframe (e.g., '1h', '15m', '1d').
        :param limit: Number of candles (max 1000).
        :param start_time: Milliseconds timestamp.
        :param end_time: Milliseconds timestamp.
        :return: Normalized list of OHLCV dicts.
        """
        target_symbol = symbol or self.symbol
        target_interval = interval or self.interval

        params: Dict[str, Any] = {
            "symbol": target_symbol.upper(),
            "interval": target_interval,
            "limit": limit,
        }
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time

        try:
            raw_klines = await self.fetch_json(endpoint="/api/v3/klines", params=params)
        except Exception as exc:
            # Attempt fallback public market data API if primary is geo-blocked (HTTP 451) or unreachable
            if hasattr(settings, "binance_fallback_url") and self.base_url != settings.binance_fallback_url:
                original_url = self.base_url
                try:
                    self.base_url = settings.binance_fallback_url
                    raw_klines = await self.fetch_json(endpoint="/api/v3/klines", params=params)
                except Exception:
                    raise exc
                finally:
                    self.base_url = original_url
            else:
                raise exc

        normalized: List[Dict[str, Any]] = []
        for kline in raw_klines:
            open_ms = int(kline[0])
            close_ms = int(kline[6])

            # Convert milliseconds to UTC datetime string
            dt_open = datetime.fromtimestamp(open_ms / 1000.0, tz=timezone.utc)
            dt_close = datetime.fromtimestamp(close_ms / 1000.0, tz=timezone.utc)
            hour_str = dt_open.strftime("%Y-%m-%d %H:00:00")

            record = {
                "source": "binance",
                "asset_ticker": target_symbol.upper(),
                "interval": target_interval,
                "timestamp_open_ms": open_ms,
                "timestamp_close_ms": close_ms,
                "datetime_open_utc": dt_open.isoformat(),
                "datetime_close_utc": dt_close.isoformat(),
                "timestamp_hour": hour_str,
                "open_price": float(kline[1]),
                "high_price": float(kline[2]),
                "low_price": float(kline[3]),
                "close_price": float(kline[4]),
                "volume": float(kline[5]),
                "quote_volume": float(kline[7]),
                "trades_count": int(kline[8]),
            }
            normalized.append(record)

        return normalized
