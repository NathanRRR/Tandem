#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

git pull --ff-only

docker compose pull db
docker compose build --pull app
docker compose up -d db app

docker compose exec -T app npx drizzle-kit migrate

echo "[deploy] done"
