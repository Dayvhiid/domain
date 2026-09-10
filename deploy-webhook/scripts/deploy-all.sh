#!/bin/bash
set -euo pipefail

MONOREPO="/home/starswe1/domains/domain"
FRONTEND_BUILD="$MONOREPO/frontend/dist"
FRONTEND_DEPLOY="/home/starswe1/domains/3starswebhosting.co.za/public_html"
BACKEND_DIR="$MONOREPO/backend"
LOG="/home/starswe1/domains/domain/deploy-webhook/deploy.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG"; }

log "=== Deploy started ==="

log "Pulling latest code..."
cd "$MONOREPO"
git fetch origin main
git reset --hard origin/main

log "Building frontend..."
cd "$MONOREPO/frontend"
npm ci
npm run build

log "Deploying frontend to public_html..."
rsync -avz --delete "$FRONTEND_BUILD/" "$FRONTEND_DEPLOY/"

log "Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install --omit=dev --production

log "Restarting backend..."
# DirectAdmin Passenger: touch tmp/restart.txt to trigger restart
# Create tmp dir if it doesn't exist (needed for Passenger restart mechanism)
mkdir -p "$BACKEND_DIR/tmp"
touch "$BACKEND_DIR/tmp/restart.txt"

log "=== Deploy finished ==="
