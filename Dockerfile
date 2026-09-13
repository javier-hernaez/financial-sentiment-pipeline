FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies & Node.js 20 LTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set up non-root user for Hugging Face Spaces (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /app

# Install Python dependencies (PyTorch CPU build to keep image lean and fast)
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir transformers huggingface_hub && \
    pip install --no-cache-dir -r requirements.txt

# Pre-cache FinBERT weights into image layer so space boots instantly
RUN python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; AutoTokenizer.from_pretrained('ProsusAI/finbert'); AutoModelForSequenceClassification.from_pretrained('ProsusAI/finbert')"

# Build Next.js frontend
WORKDIR /app/frontend
COPY --chown=user:user frontend/package*.json ./
RUN npm ci
COPY --chown=user:user frontend/ ./
RUN npm run build

# Copy project source and setup data directory
WORKDIR /app
COPY --chown=user:user src/ ./src/
COPY --chown=user:user start.sh ./
RUN chmod +x start.sh && mkdir -p /app/data/bronze /app/data/silver /app/data/gold

EXPOSE 7860

CMD ["./start.sh"]
