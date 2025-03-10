#!/bin/bash

# This script contains helper commands for database operations

# Display usage information
show_usage() {
  echo "Database Management Commands"
  echo "----------------------------"
  echo "Usage: ./scripts/db-commands.sh [command]"
  echo
  echo "Available commands:"
  echo "  migrate  - Run database migrations using Drizzle"
  echo "  seed     - Seed database with sample data from memory storage"
  echo "  status   - Check database connection status"
  echo "  help     - Show this help message"
  echo
}

# Check if DATABASE_URL is set
check_db_url() {
  if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set."
    echo "Please set it before running database commands."
    exit 1
  fi
}

# Run database migrations
run_migrations() {
  check_db_url
  echo "Running database migrations..."
  tsx server/dbMigrate.ts
}

# Seed database with data
seed_database() {
  check_db_url
  echo "Seeding database with sample data..."
  tsx scripts/migrateToNeon.ts
}

# Check database status
check_status() {
  check_db_url
  echo "Checking database connection status..."
  # Create a simple query to check if connection works
  node -e "
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);
  
  async function checkConnection() {
    try {
      const result = await sql('SELECT NOW() as time');
      console.log('✅ Database connection successful!');
      console.log('Current database time:', result[0].time);
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
    }
  }
  
  checkConnection();
  "
}

# Process command argument
case "$1" in
  migrate)
    run_migrations
    ;;
  seed)
    seed_database
    ;;
  status)
    check_status
    ;;
  help|"")
    show_usage
    ;;
  *)
    echo "Unknown command: $1"
    show_usage
    exit 1
    ;;
esac