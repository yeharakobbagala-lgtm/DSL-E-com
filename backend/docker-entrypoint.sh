#!/bin/sh
set -e

echo "🚀 [entrypoint] DSL Backend container initializing..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ [entrypoint] ERROR: DATABASE_URL is not set! Database operations will fail."
else
  echo "📦 [entrypoint] Synchronizing database schema and tables (prisma db push)..."
  # prisma db push creates the database if it doesn't exist and builds all schema tables
  if npx prisma db push --skip-generate; then
    echo "✅ [entrypoint] Database schema synchronized successfully!"
  else
    echo "⚠️ [entrypoint] 'prisma db push' failed, falling back to 'prisma migrate deploy'..."
    npx prisma migrate deploy || echo "⚠️ [entrypoint] Migration deploy finished with warnings."
  fi

  # Automatically run database seed if AUTO_SEED is true
  if [ "$AUTO_SEED" = "true" ] || [ "$AUTO_SEED" = "1" ]; then
    echo "🌱 [entrypoint] AUTO_SEED is enabled. Seeding categories, brands, products, store settings, and admin user..."
    npx tsx prisma/seed.ts || echo "⚠️ [entrypoint] Seed completed with non-fatal status."
  else
    echo "ℹ️ [entrypoint] AUTO_SEED is not set to 'true'. Skipping seed. (Set AUTO_SEED=true in CapRover App Configs to run seed on startup)"
  fi
fi

echo "✨ [entrypoint] Starting NestJS server..."
exec "$@"
