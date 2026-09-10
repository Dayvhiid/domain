#!/bin/bash
set -euo pipefail

MONOREPO_DIR="/home/starswe1/domains/api.3starswebhosting.co.za"
FRONTEND_DIST="$MONOREPO_DIR/frontend/dist"
FRONTEND_DEPLOY="/home/starswe1/domains/3starswebhosting.co.za/public_html"
BACKEND_DIR="$MONOREPO_DIR"

echo "=== Deploy started at $(date) ==="

cd "$MONOREPO_DIR"
git fetch origin main
git reset --hard origin/main

echo "--- Building frontend ---"
cd "$MONOREPO_DIR/frontend"
npm ci
npm run build

echo "--- Deploying frontend ---"
rsync -avz --delete "$FRONTEND_DIST/" "$FRONTEND_DEPLOY/"

echo "--- Installing backend dependencies ---"
cd "$BACKEND_DIR/backend"
npm install --omit=dev --production

echo "--- Restarting backend ---"
touch "$BACKEND_DIR/tmp/restart.txt" 2>/dev/null || true

echo "=== Deploy finished at $(date) ==="
