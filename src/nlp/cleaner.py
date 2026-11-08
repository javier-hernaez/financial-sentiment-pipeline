"""Text cleaning and normalization, for one string or a whole Polars column with the same rules."""

import re

import polars as pl

URL_PATTERN = r"https?://\S+|www\.\S+"
REDDIT_MENTION_PATTERN = r"/?(?:r|u)/[A-Za-z0-9_-]+"
SPECIAL_CHARS_PATTERN = r"[^\w\s\$\%\.\,\!\?\-]"  # keeps financial punctuation, drops emoji and the like
WHITESPACE_PATTERN = r"\s+"
MAX_CHARS = 280


class TextCleaner:
    """Sanitizer for social media and financial news."""

    _URL = re.compile(URL_PATTERN)
    _REDDIT_MENTION = re.compile(REDDIT_MENTION_PATTERN)
    _SPECIAL_CHARS = re.compile(SPECIAL_CHARS_PATTERN)
    _WHITESPACE = re.compile(WHITESPACE_PATTERN)

    @classmethod
    def clean_string(cls, text: str, max_chars: int = MAX_CHARS) -> str:
        """Cleans a single string and limits it to headline length, cutting at a word boundary."""
        if not text or not isinstance(text, str):
            return ""
        text = cls._URL.sub("", text)
        text = cls._REDDIT_MENTION.sub("", text)
        text = cls._SPECIAL_CHARS.sub(" ", text)
        text = cls._WHITESPACE.sub(" ", text).strip()
        if max_chars and len(text) > max_chars:
            text = text[:max_chars].rsplit(" ", 1)[0]
        return text

    @staticmethod
    def clean_polars_column(df: pl.DataFrame, title_col: str = "title", body_col: str = "text_body") -> pl.DataFrame:
        """Unifies title and body into a cleaned_text column using vectorized string operations."""
        if df.is_empty():
            return df.with_columns(pl.lit("").alias("cleaned_text"))

        cleaned = (
            pl.concat_str([pl.col(title_col).fill_null(""), pl.lit(". "), pl.col(body_col).fill_null("")])
            .str.replace_all(URL_PATTERN, "")
            .str.replace_all(REDDIT_MENTION_PATTERN, "")
            .str.replace_all(SPECIAL_CHARS_PATTERN, " ")
            .str.replace_all(WHITESPACE_PATTERN, " ")
            .str.strip_chars()
            .str.slice(0, MAX_CHARS)
        )
        return df.with_columns(cleaned.alias("cleaned_text"))
