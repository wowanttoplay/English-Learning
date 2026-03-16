#!/bin/bash
# Full deployment script for English Learning app
# Usage: bash scripts/deploy.sh [--skip-seed] [--skip-frontend] [--skip-api]

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$ROOT_DIR/packages/api"
WEB_DIR="$ROOT_DIR/packages/web"

cd "$ROOT_DIR"

SKIP_SEED=false
SKIP_FRONTEND=false
SKIP_API=false

for arg in "$@"; do
  case $arg in
    --skip-seed) SKIP_SEED=true ;;
    --skip-frontend) SKIP_FRONTEND=true ;;
    --skip-api) SKIP_API=true ;;
  esac
done

echo "=== English Learning Deploy ==="
echo "Root: $ROOT_DIR"
echo ""

# 1. Typecheck
echo "[1/7] Typechecking..."
pnpm -r typecheck
echo "  ✓ Typecheck passed"
echo ""

# 2. Validate data
echo "[2/7] Validating data..."
pnpm --filter @english-learning/web validate:data
echo "  ✓ Data validation passed"
echo ""

# 3. Build frontend
echo "[3/7] Building frontend..."
pnpm --filter @english-learning/web build
echo "  ✓ Frontend built"
echo ""

# 4. Apply remote DB migrations (must run from packages/api/ where wrangler.toml lives)
echo "[4/7] Applying remote DB migrations..."
cd "$API_DIR"
npx wrangler d1 migrations apply english-learning --remote
cd "$ROOT_DIR"
echo "  ✓ Migrations applied"
echo ""

# 5. Seed remote DB
if [ "$SKIP_SEED" = false ]; then
  echo "[5/7] Generating seed.sql and seeding remote DB..."
  pnpm --filter @english-learning/api migrate:content
  cd "$API_DIR"
  npx wrangler d1 execute english-learning --remote --file=seed.sql
  cd "$ROOT_DIR"
  echo "  ✓ Remote DB seeded"
else
  echo "[5/7] Skipping seed (--skip-seed)"
fi
echo ""

# 6. Deploy API Worker (must run from packages/api/)
if [ "$SKIP_API" = false ]; then
  echo "[6/7] Deploying API Worker..."
  cd "$API_DIR"
  npx wrangler deploy
  cd "$ROOT_DIR"
  echo "  ✓ API Worker deployed"
else
  echo "[6/7] Skipping API deploy (--skip-api)"
fi
echo ""

# 7. Deploy frontend to Pages (must run from packages/web/)
if [ "$SKIP_FRONTEND" = false ]; then
  echo "[7/7] Deploying frontend to Cloudflare Pages..."
  cd "$WEB_DIR"
  npx wrangler pages deploy dist --project-name english-learning-web --commit-dirty=true
  cd "$ROOT_DIR"
  echo "  ✓ Frontend deployed"
else
  echo "[7/7] Skipping frontend deploy (--skip-frontend)"
fi
echo ""

echo "=== Deploy complete! ==="
