"""Request and response bodies. Invalid input is rejected with HTTP 422 instead of being reinterpreted."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from ..configs.settings import settings

Stage = Literal["full", "extract", "transform", "gold"]
SYMBOL_PATTERN = r"^[A-Za-z0-9_-]{2,20}$"


class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., max_length=10000, description="Headline or financial commentary to evaluate")


class RunStageRequest(BaseModel):
    stage: Stage = Field(default="full", description="Stage to execute")
    symbol: str = Field(default="BTCUSDT", description="One of the supported trading pairs")
    hours: int = Field(default=24, ge=1, le=500, description="Hours of candles to ingest")
    include_social: bool = Field(
        default=True,
        description="Also fetch the news feeds. They are the same for every asset, so a run over several "
        "assets only needs them on the first.",
    )

    @field_validator("symbol")
    @classmethod
    def _supported_symbol(cls, value: str) -> str:
        symbol = value.strip().upper()
        if symbol not in settings.supported_assets:
            raise ValueError(f"Unsupported symbol. Choose one of: {', '.join(settings.supported_assets)}")
        return symbol


class StageAccepted(BaseModel):
    run_id: str
    status: Literal["running"] = "running"
    stage: Stage
    symbol: str


class WarehouseOpsRequest(BaseModel):
    action: Literal["vacuum", "checkpoint", "refresh_views"]
