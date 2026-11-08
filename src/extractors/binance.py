"""Binance REST API Kline (OHLCV) Extractor."""

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from ..configs.settings import settings
from .base import BaseAsyncExtractor

logger = logging.getLogger(__name__)

KLINES_ENDPOINT = "/api/v3/klines"
# The request itself is wrong, so the mirror would reject it too
REQUEST_ERRORS = frozenset({400, 404})


class BinanceKlinesExtractor(BaseAsyncExtractor):
    """Extractor for OHLCV candles from the Binance public API, with a mirror for geo-blocked regions."""

    def __init__(self, base_url: str | None = None, symbol: str | None = None, interval: str | None = None):
        super().__init__(name="BinanceKlines", base_url=base_url or settings.binance_base_url)
        self.symbol = symbol or settings.default_symbol
        self.interval = interval or settings.default_interval

    async def _fetch_klines(self, params: dict[str, Any]) -> list[list[Any]]:
        klines: list[list[Any]]
        try:
            klines = await self.fetch_json(KLINES_ENDPOINT, params=params)
        except (httpx.RequestError, httpx.HTTPStatusError) as exc:
            status = exc.response.status_code if isinstance(exc, httpx.HTTPStatusError) else None
            fallback = settings.binance_fallback_url
            if status in REQUEST_ERRORS or not fallback or fallback.rstrip("/") == self.base_url:
                raise
            logger.warning("Binance primary host failed (%s); trying %s", status or repr(exc), fallback)
            klines = await self.fetch_json(KLINES_ENDPOINT, params=params, base_url=fallback)
        return klines

    async def extract(
        self,
        symbol: str | None = None,
        interval: str | None = None,
        limit: int = 24,
        start_time: int | None = None,
        end_time: int | None = None,
    ) -> list[dict[str, Any]]:
        """
        Extracts OHLCV candles from /api/v3/klines.

        :param symbol: Trading pair ticker (e.g., BTCUSDT).
        :param interval: Candle timeframe (e.g., '1h', '15m', '1d').
        :param limit: Number of candles (max 1000).
        :param start_time: Milliseconds timestamp.
        :param end_time: Milliseconds timestamp.
        :return: Normalized list of OHLCV dicts.
        """
        target_symbol = (symbol or self.symbol).upper()
        target_interval = interval or self.interval

        params: dict[str, Any] = {"symbol": target_symbol, "interval": target_interval, "limit": limit}
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time

        normalized: list[dict[str, Any]] = []
        for kline in await self._fetch_klines(params):
            open_ms = int(kline[0])
            close_ms = int(kline[6])
            dt_open = datetime.fromtimestamp(open_ms / 1000.0, tz=timezone.utc)
            dt_close = datetime.fromtimestamp(close_ms / 1000.0, tz=timezone.utc)
            normalized.append(
                {
                    "source": "binance",
                    "asset_ticker": target_symbol,
                    "interval": target_interval,
                    "timestamp_open_ms": open_ms,
                    "timestamp_close_ms": close_ms,
                    "datetime_open_utc": dt_open.isoformat(),
                    "datetime_close_utc": dt_close.isoformat(),
                    "timestamp_hour": dt_open.strftime("%Y-%m-%d %H:00:00"),
                    "open_price": float(kline[1]),
                    "high_price": float(kline[2]),
                    "low_price": float(kline[3]),
                    "close_price": float(kline[4]),
                    "volume": float(kline[5]),
                    "quote_volume": float(kline[7]),
                    "trades_count": int(kline[8]),
                }
            )
        return normalized
