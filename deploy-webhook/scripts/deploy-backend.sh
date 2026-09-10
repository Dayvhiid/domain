#!/bin/bash
set -euo pipefail

MONOREPO="/home/starswe1/domains/domain"
BACKEND_DIR="$MONOREPO/backend"

echo "[$(date)] Deploying backend..."

cd "$MONOREPO"
git fetch origin main
git reset --hard origin/main

cd "$BACKEND_DIR"
npm install --omit=dev --production

mkdir -p "$BACKEND_DIR/tmp"
touch "$BACKEND_DIR/tmp/restart.txt"

echo "[$(date)] Backend deploy complete."
