"""Application settings and environment configuration."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # Market Data (Binance & Macro)
    binance_base_url: str = Field(default="https://api.binance.com", alias="BINANCE_BASE_URL")
    binance_fallback_url: str = Field(default="https://data-api.binance.vision", alias="BINANCE_FALLBACK_URL")
    fear_greed_base_url: str = Field(default="https://api.alternative.me", alias="FEAR_GREED_BASE_URL")
    default_symbol: str = Field(default="BTCUSDT", alias="DEFAULT_SYMBOL")
    default_interval: str = Field(default="1h", alias="DEFAULT_INTERVAL")

    # Security & Access Control
    api_secret_key: str = Field(default="dev-insecure-secret-key", alias="API_SECRET_KEY")
    allowed_origins: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080", "http://127.0.0.1:8080"],
        alias="ALLOWED_ORIGINS",
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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def setup_directories(self) -> None:
        """Ensure all data lake directories exist."""
        for path in [self.bronze_dir, self.silver_dir, self.gold_dir]:
            path.mkdir(parents=True, exist_ok=True)
            (path / "market").mkdir(parents=True, exist_ok=True)
            (path / "social").mkdir(parents=True, exist_ok=True)
            (path / "fear_greed").mkdir(parents=True, exist_ok=True)


settings = Settings()
