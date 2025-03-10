#!/bin/bash

# Script to manage Neon database operations

command=$1

case $command in
  migrate)
    echo "Running database migration..."
    npx tsx server/dbMigrate.ts
    ;;
  seed)
    echo "Seeding database..."
    npx tsx scripts/migrateToNeon.ts
    ;;
  dev)
    echo "Starting application with Neon database..."
    USE_NEON_DB=true npx tsx server/index.ts
    ;;
  *)
    echo "Usage: $0 {migrate|seed|dev}"
    echo "  migrate - Run database migrations"
    echo "  seed    - Seed the database with initial data"
    echo "  dev     - Start the application with Neon database"
    exit 1
    ;;
esac

exit 0