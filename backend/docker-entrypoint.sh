#!/bin/sh
set -e

echo "🚀 [entrypoint] DSL Backend container initializing..."

# 1. Run database migrations to ensure all schema tables exist
if [ -n "$DATABASE_URL" ]; then
  echo "📦 [entrypoint] Running database migrations (prisma migrate deploy)..."
  npx prisma migrate deploy || {
    echo "⚠️ [entrypoint] 'prisma migrate deploy' encountered an issue. Falling back to 'prisma db push'..."
    npx prisma db push --skip-generate || true
  }

  # 2. Check if automatic seeding is requested
  if [ "$AUTO_SEED" = "true" ] || [ "$AUTO_SEED" = "1" ]; then
    echo "🌱 [entrypoint] AUTO_SEED is enabled. Seeding categories, products, store settings, and admin user..."
    npx tsx prisma/seed.ts || echo "⚠️ [entrypoint] Seed completed with non-fatal status."
  else
    echo "ℹ️ [entrypoint] AUTO_SEED is not set to 'true'. Skipping seed. (Set AUTO_SEED=true in CapRover App Configs to run seed on startup)"
  fi
else
  echo "⚠️ [entrypoint] DATABASE_URL is not set. Skipping migrations."
fi

echo "✨ [entrypoint] Starting NestJS application..."
exec "$@"
