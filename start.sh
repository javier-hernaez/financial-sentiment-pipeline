#!/bin/bash
set -e

echo "=========================================================="
echo "  Starting Market Intelligence Engine (Hugging Face Space)"
echo "=========================================================="

# Ensure directories exist
mkdir -p data/bronze data/silver data/gold

# 1. Start Python Quant Engine & DuckDB Server on internal port 8080 in background
echo "[*] Launching Python Quant Engine & DuckDB on port 8080..."
python -m src.dashboard.server --host 127.0.0.1 --port 8080 &
BACKEND_PID=$!

# 2. Wait for backend to be healthy
echo "[*] Waiting for backend API to be ready..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8080/api/health > /dev/null 2>&1; then
    echo "[+] Backend API is online and responding."
    break
  fi
  sleep 1
done

# 3. Start Next.js Frontend in production on public port 7860
echo "[*] Launching Next.js Production Server on port 7860..."
cd /app/frontend
npx next start -p 7860 &
FRONTEND_PID=$!

# Function to handle shutdown
cleanup() {
  echo "Stopping services..."
  kill -TERM "$BACKEND_PID" 2>/dev/null || true
  kill -TERM "$FRONTEND_PID" 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

# 4. Supervisor watchdog loop: if either process dies, exit container with error so Docker restarts
while true; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "[!] CRITICAL ERROR: Python Quant API Backend exited unexpectedly."
    cleanup
    exit 1
  fi
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "[!] CRITICAL ERROR: Next.js Frontend Server exited unexpectedly."
    cleanup
    exit 1
  fi
  sleep 3
done
