#!/bin/bash
set -euo pipefail

MONOREPO="/home/starswe1/domains/domain"
FRONTEND_BUILD="$MONOREPO/frontend/dist"
FRONTEND_DEPLOY="/home/starswe1/domains/3starswebhosting.co.za/public_html"

echo "[$(date)] Deploying frontend..."

cd "$MONOREPO"
git fetch origin main
git reset --hard origin/main

cd "$MONOREPO/frontend"
npm ci
npm run build

rsync -avz --delete "$FRONTEND_BUILD/" "$FRONTEND_DEPLOY/"

echo "[$(date)] Frontend deploy complete."
