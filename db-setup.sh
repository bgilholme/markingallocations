#!/bin/bash

# This script sets up the database environment
# Run this script to initialize the database based on .env settings

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check database availability
check_db_connection() {
  echo "Checking database connection..."
  if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable not set."
    return 1
  fi

  node -e "
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);
  
  async function checkConnection() {
    try {
      const result = await sql('SELECT NOW() as time');
      console.log('✅ Database connection successful!');
      console.log('Database server time:', result[0].time);
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }
  
  checkConnection().then(success => process.exit(success ? 0 : 1));
  "

  return $?
}

# Run migrations
run_migrations() {
  echo "Running database migrations..."
  tsx server/dbMigrate.ts
  if [ $? -ne 0 ]; then
    echo "❌ Migration failed."
    return 1
  fi
  echo "✅ Migrations completed successfully."
  return 0
}

# Check environment settings
if [ "$USE_POSTGRES" == "true" ]; then
  echo "PostgreSQL database is enabled in configuration."
  
  if check_db_connection; then
    echo "Database connection is valid."
    
    read -p "Would you like to run migrations now? (y/n): " run_migrate
    if [[ $run_migrate == "y" || $run_migrate == "Y" ]]; then
      run_migrations
      
      if [ $? -eq 0 ]; then
        read -p "Would you like to seed the database with sample data? (y/n): " seed_db
        if [[ $seed_db == "y" || $seed_db == "Y" ]]; then
          echo "Seeding database..."
          tsx scripts/migrateToNeon.ts
          if [ $? -eq 0 ]; then
            echo "✅ Database seeded successfully."
          else
            echo "❌ Database seeding failed."
          fi
        fi
      fi
    fi
  else
    echo "❌ Database connection failed. Please check your configuration."
    echo "Running with in-memory storage instead."
    
    # Update environment to use in-memory storage
    if [ -f .env ]; then
      sed -i 's/USE_POSTGRES=true/USE_POSTGRES=false/' .env
      echo "Updated .env to use in-memory storage."
    fi
  fi
else
  echo "Using in-memory storage (PostgreSQL database disabled in configuration)."
  echo "To enable PostgreSQL, run: ./scripts/toggle-storage.sh"
fi

echo
echo "Setup complete. You can now start the application with:"
echo "npm run dev"