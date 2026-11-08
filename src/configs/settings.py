"""Application settings and environment configuration."""

import json
from pathlib import Path
from typing import Annotated, Any

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

INSECURE_DEFAULT_SECRET = "dev-insecure-secret-key"  # noqa: S105 - rejected at startup in production
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Strongly-typed application settings."""

    # Environment
    app_env: str = Field(default="development", alias="APP_ENV")

    # Paths. Relative values are anchored to the project root, so the working directory never matters.
    project_root: Path = PROJECT_ROOT
    bronze_dir: Path = Path("data/bronze")
    duckdb_path: Path = Path("data/warehouse.duckdb")

    # Market Data (Binance)
    binance_base_url: str = Field(default="https://api.binance.com", alias="BINANCE_BASE_URL")
    binance_fallback_url: str = Field(default="https://data-api.binance.vision", alias="BINANCE_FALLBACK_URL")
    default_symbol: str = Field(default="BTCUSDT", alias="DEFAULT_SYMBOL")
    default_interval: str = Field(default="1h", alias="DEFAULT_INTERVAL")
    supported_assets: list[str] = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]

    # Public repository, used to report the latest CI run on the project page
    github_repo: str = Field(default="javier-hernaez/financial-sentiment-pipeline", alias="GITHUB_REPO")
    github_branch: str = Field(default="main", alias="GITHUB_BRANCH")

    # Security & Access Control
    api_secret_key: str = Field(default=INSECURE_DEFAULT_SECRET, alias="API_SECRET_KEY")
    # NoDecode: accept the comma-separated format documented in .env.example instead of JSON
    allowed_origins: Annotated[list[str], NoDecode] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080", "http://127.0.0.1:8080"],
        alias="ALLOWED_ORIGINS",
    )

    # NLP / FinBERT
    finbert_model_name: str = Field(default="ProsusAI/finbert", alias="FINBERT_MODEL_NAME")
    nlp_batch_size: int = Field(default=64, gt=0, alias="NLP_BATCH_SIZE")
    use_mock_nlp: bool = Field(default=False, alias="USE_MOCK_NLP")

    # HTTP / Resilience
    max_retries: int = Field(default=4, ge=1)
    base_backoff_seconds: float = 1.0
    max_backoff_seconds: float = 16.0
    request_timeout_seconds: float = 15.0

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: Any) -> Any:
        if isinstance(value, str):
            raw = value.strip()
            if raw.startswith("["):
                return json.loads(raw)
            return [origin.strip() for origin in raw.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def _anchor_paths(self) -> "Settings":
        self.bronze_dir = self.project_root / self.bronze_dir
        self.duckdb_path = self.project_root / self.duckdb_path
        return self

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in ("production", "prod")

    def setup_directories(self) -> None:
        """Ensures the data lake and the warehouse folder exist."""
        self.bronze_dir.mkdir(parents=True, exist_ok=True)
        self.duckdb_path.parent.mkdir(parents=True, exist_ok=True)


settings = Settings()
