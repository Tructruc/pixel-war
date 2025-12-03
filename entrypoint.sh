#!/bin/sh

# 1. Sync Database Schema
# 'db push' syncs the schema without needing migration files.
echo "Syncing database schema..."
cd /app/backend
npx prisma db push

# 2. Start Express Backend in the background (&)
echo "Starting Express Backend..."
# Make sure 'index.js' matches your actual entry file
node app.js &

# 3. Start Caddy in the foreground
echo "Starting Caddy..."
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile