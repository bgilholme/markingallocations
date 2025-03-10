#!/bin/bash

# This script toggles between storage types by updating .env

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ .env file not found. Creating a default one..."
  echo "USE_POSTGRES=false" > .env
  echo "# Environment variables for database connection" >> .env
fi

# Load current setting
CURRENT_SETTING=$(grep -i "USE_POSTGRES=" .env | cut -d= -f2)

if [ "$CURRENT_SETTING" == "true" ]; then
  # Switch to in-memory
  sed -i 's/USE_POSTGRES=true/USE_POSTGRES=false/' .env
  echo "✅ Switched to in-memory storage"
  echo "The application will now use in-memory storage."
else
  # Check PostgreSQL connection before switching
  echo "Checking PostgreSQL connection..."
  if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable not set."
    echo "You need to create a PostgreSQL database first."
    echo "Run: npm run db:create"
    exit 1
  fi

  # Test the connection
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

  if [ $? -eq 0 ]; then
    # Connection successful, switch to PostgreSQL
    sed -i 's/USE_POSTGRES=false/USE_POSTGRES=true/' .env
    echo "✅ Switched to PostgreSQL storage"
    echo "The application will now use PostgreSQL database."
    echo "If this is the first time, you may need to run migrations:"
    echo "npm run db:push"
  else
    echo "❌ PostgreSQL connection failed. Staying with in-memory storage."
    echo "Please check your database configuration."
  fi
fi

echo
echo "Restart the application for changes to take effect."