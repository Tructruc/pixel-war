#!/bin/sh

node /app/backend/app.js &
NODE_PID=$!

caddy run --config /app/Caddyfile &
CADDY_PID=$!

term() {
    kill -TERM "$NODE_PID" "$CADDY_PID" 2>/dev/null || true
    wait "$NODE_PID" "$CADDY_PID" 2>/dev/null || true
}

trap term INT TERM

wait "$NODE_PID" "$CADDY_PID"
EXIT_CODE=$?