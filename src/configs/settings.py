"""Application settings and environment configuration."""
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Strongly-typed application settings."""
    
    # Environment
    app_env: str = Field(default="development", alias="APP_ENV")
    debug: bool = Field(default=True, alias="DEBUG")

    # Project Root and Paths
    project_root: Path = Path(__file__).resolve().parent.parent.parent
    data_lake_dir: Path = Path("data")
    bronze_dir: Path = Path("data/bronze")
    silver_dir: Path = Path("data/silver")
    gold_dir: Path = Path("data/gold")
    duckdb_path: Path = Path("data/warehouse.duckdb")

    # Market Data (Binance)
    binance_base_url: str = Field(default="https://api.binance.com", alias="BINANCE_BASE_URL")
    default_symbol: str = Field(default="BTCUSDT", alias="DEFAULT_SYMBOL")
    default_interval: str = Field(default="1h", alias="DEFAULT_INTERVAL")

    # Macro Sentiment (Alternative.me)
    fear_greed_api_url: str = Field(
        default="https://api.alternative.me/fng/", alias="FEAR_GREED_API_URL"
    )

    # Social Data (Reddit)
    reddit_client_id: Optional[str] = Field(default=None, alias="REDDIT_CLIENT_ID")
    reddit_client_secret: Optional[str] = Field(default=None, alias="REDDIT_CLIENT_SECRET")
    reddit_user_agent: str = Field(
        default="MarketIntelligenceEngine/0.1.0", alias="REDDIT_USER_AGENT"
    )

    # NLP / FinBERT
    finbert_model_name: str = Field(default="ProsusAI/finbert", alias="FINBERT_MODEL_NAME")
    nlp_batch_size: int = Field(default=64, alias="NLP_BATCH_SIZE")
    use_mock_nlp: bool = Field(default=False, alias="USE_MOCK_NLP")

    # HTTP / Resilience
    max_retries: int = 4
    base_backoff_seconds: float = 1.0
    max_backoff_seconds: float = 16.0
    request_timeout_seconds: float = 15.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def setup_directories(self) -> None:
        """Ensure all data lake directories exist."""
        for path in [self.bronze_dir, self.silver_dir, self.gold_dir]:
            path.mkdir(parents=True, exist_ok=True)
            (path / "market").mkdir(parents=True, exist_ok=True)
            (path / "social").mkdir(parents=True, exist_ok=True)
            (path / "fear_greed").mkdir(parents=True, exist_ok=True)


settings = Settings()
