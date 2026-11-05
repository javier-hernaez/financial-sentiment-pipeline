# ---------------------------------------------------------------------------
# Stage 1: build the Next.js frontend as a self-contained "standalone" server.
# Only the traced runtime files end up in the final image (no npm, no full node_modules).
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS frontend-builder

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_STANDALONE=1

WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: runtime image (Python API + FinBERT + Node binary for the frontend)
# ---------------------------------------------------------------------------
FROM python:3.12-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=7860 \
    DEBIAN_FRONTEND=noninteractive

# curl: health checks in start.sh / HEALTHCHECK. libstdc++6: required by the Node binary.
# No compiler toolchain needed: every Python dependency ships manylinux wheels.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Node.js runtime only (same Debian release as the builder stage, so glibc matches)
COPY --from=frontend-builder /usr/local/bin/node /usr/local/bin/node

# Set up non-root user for Hugging Face Spaces (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /app

# Install runtime Python dependencies only (PyTorch CPU build to keep image lean)
COPY --chown=user:user requirements.txt .
RUN pip install --user torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --user -r requirements.txt

# Pre-cache FinBERT weights into image layer so space boots instantly
RUN python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; AutoTokenizer.from_pretrained('ProsusAI/finbert'); AutoModelForSequenceClassification.from_pretrained('ProsusAI/finbert')"

# Standalone frontend server + static assets
COPY --from=frontend-builder --chown=user:user /build/.next/standalone ./frontend/
COPY --from=frontend-builder --chown=user:user /build/.next/static ./frontend/.next/static

# Copy project source and setup data directory
COPY --chown=user:user src/ ./src/
COPY --chown=user:user start.sh ./
RUN chmod +x start.sh && mkdir -p /app/data/bronze /app/data/silver /app/data/gold

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fs http://127.0.0.1:8080/api/health && curl -fs -o /dev/null http://127.0.0.1:7860/ || exit 1

CMD ["./start.sh"]
