"""Alternative.me Crypto Fear & Greed Index Extractor."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from .base import BaseAsyncExtractor
from ..configs.settings import settings


class FearGreedExtractor(BaseAsyncExtractor):
    """Extractor for macroeconomic sentiment (Crypto Fear & Greed Index)."""

    def __init__(self, api_url: Optional[str] = None):
        api_url = api_url or settings.fear_greed_api_url
        super().__init__(name="FearAndGreed", base_url=api_url)

    async def extract(self, limit: int = 30) -> List[Dict[str, Any]]:
        """
        Fetches the Fear & Greed Index values.
        
        :param limit: Number of historical days to retrieve (0 returns all history).
        :return: Normalized list of daily sentiment records.
        """
        params = {"limit": limit, "format": "json"}
        payload = await self.fetch_json(endpoint="", params=params)

        data = payload.get("data", [])
        normalized: List[Dict[str, Any]] = []

        for item in data:
            ts = int(item["timestamp"])
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            date_str = dt.strftime("%Y-%m-%d")

            normalized.append({
                "source": "alternative_me",
                "timestamp_epoch": ts,
                "datetime_utc": dt.isoformat(),
                "date": date_str,
                "fear_and_greed_score": int(item["value"]),
                "fear_and_greed_classification": item.get("value_classification", "Unknown").lower(),
            })

        return normalized
