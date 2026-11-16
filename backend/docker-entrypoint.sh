#!/bin/sh
set -e

echo "🚀 [entrypoint] DSL Backend container initializing..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ [entrypoint] ERROR: DATABASE_URL is not set! Database operations will fail."
else
  echo "📦 [entrypoint] Synchronizing database schema and tables (prisma db push --accept-data-loss)..."
  # prisma db push creates the database if it doesn't exist and builds all schema tables
  if npx prisma db push --accept-data-loss; then
    echo "✅ [entrypoint] Database schema synchronized successfully!"
  else
    echo "⚠️ [entrypoint] 'prisma db push' failed, falling back to 'prisma migrate deploy'..."
    npx prisma migrate deploy || echo "⚠️ [entrypoint] Migration deploy finished with warnings."
  fi

  # Automatically run database seed unless explicitly disabled
  if [ "$AUTO_SEED" = "false" ] || [ "$AUTO_SEED" = "0" ]; then
    echo "ℹ️ [entrypoint] AUTO_SEED is set to false. Skipping database seed."
  else
    echo "🌱 [entrypoint] Running database seed (categories, brands, products, store settings, and default admin)..."
    npx tsx prisma/seed.ts || echo "⚠️ [entrypoint] Seed completed with non-fatal status."
  fi
fi

echo "✨ [entrypoint] Starting NestJS server..."
exec "$@"
