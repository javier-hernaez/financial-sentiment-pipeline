"""Text cleaning and normalization module using Polars and Regex."""

import re

import polars as pl


class TextCleaner:
    """High-performance text sanitizer for social media and financial news."""

    # Regex patterns compiled once
    URL_PATTERN = re.compile(r"https?://\S+|www\.\S+")
    REDDIT_USER_SUB_PATTERN = re.compile(r"/?(?:r|u)/[A-Za-z0-9_-]+")
    TICKER_PATTERN = re.compile(r"\$([A-Za-z]{2,6})")
    SPECIAL_CHARS = re.compile(r"[^\w\s\$\%\.\,\!\?\-]")
    EXTRA_WHITESPACE = re.compile(r"\s+")

    @classmethod
    def clean_string(cls, text: str, max_chars: int = 280) -> str:
        """Cleans a single string and limits length to relevant financial headline/summary context."""
        if not text or not isinstance(text, str):
            return ""

        # Remove URLs
        text = cls.URL_PATTERN.sub("", text)
        # Remove subreddit / user tags
        text = cls.REDDIT_USER_SUB_PATTERN.sub("", text)
        # Clean special emojis/characters while preserving financial punctuation
        text = cls.SPECIAL_CHARS.sub(" ", text)
        # Normalize whitespace
        text = cls.EXTRA_WHITESPACE.sub(" ", text).strip()
        if max_chars and len(text) > max_chars:
            text = text[:max_chars].rsplit(" ", 1)[0]
        return text

    @classmethod
    def clean_polars_column(
        cls, df: pl.DataFrame, title_col: str = "title", body_col: str = "text_body"
    ) -> pl.DataFrame:
        """
        Cleans and unifies title and body in a Polars DataFrame using vectorized operations.
        """
        # Combine title and text_body
        df_combined = df.with_columns(
            pl.concat_str([pl.col(title_col), pl.lit(". "), pl.col(body_col)]).alias("raw_text")
        )

        # Apply cleaning expressions
        cleaned_series = df_combined["raw_text"].map_elements(cls.clean_string, return_dtype=pl.String)

        return df_combined.with_columns(cleaned_series.alias("cleaned_text"))
