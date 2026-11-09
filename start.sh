#!/bin/bash
# Container entrypoint: runs the API and the web server, and ends with an error if either dies,
# so the orchestrator's restart policy brings the container back.
set -u

echo "[*] Starting Market Intelligence Engine"

mkdir -p data/bronze

# The secret only travels between these two processes, so without one configured a fresh random
# value is safer than the public development default, which the API refuses in production anyway.
if [ -z "${API_SECRET_KEY:-}" ] || [ "${API_SECRET_KEY}" = "dev-insecure-secret-key" ]; then
  API_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
  echo "[*] API_SECRET_KEY not configured: generated one for this container's lifetime"
fi
export API_SECRET_KEY

echo "[*] Launching the API on port 8080"
python -m src.dashboard.server --host 127.0.0.1 --port 8080 &
BACKEND_PID=$!

stop_services() {
  kill -TERM "$BACKEND_PID" "${FRONTEND_PID:-}" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap 'stop_services; exit 0' SIGINT SIGTERM

echo "[*] Waiting for the API to be ready"
for _ in $(seq 1 30); do
  curl -fs http://127.0.0.1:8080/api/health > /dev/null 2>&1 && break
  kill -0 "$BACKEND_PID" 2>/dev/null || { echo "[!] The API exited during startup"; exit 1; }
  sleep 1
done

echo "[*] Launching the web server on port 7860"
cd /app/frontend
# Standalone Next.js server. HOSTNAME must be set explicitly: Docker sets it to the container id.
PORT=7860 HOSTNAME=0.0.0.0 node server.js &
FRONTEND_PID=$!

# Returns as soon as either process ends, whatever its exit code
wait -n "$BACKEND_PID" "$FRONTEND_PID"
STATUS=$?
echo "[!] A service exited unexpectedly (code $STATUS)"
stop_services
exit 1
