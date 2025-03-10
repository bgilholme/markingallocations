// This script creates a PostgreSQL database in the Replit environment

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function createDatabase() {
  console.log('Creating PostgreSQL database...');
  
  try {
    // Create the database using the Replit tool
    const result = execSync('npx create_postgresql_database_tool', { encoding: 'utf8' });
    console.log(result);
    
    // Check if it was successful
    if (result.includes('successfully created')) {
      console.log('✅ Database created successfully!');
      
      // Update the .env file to use PostgreSQL
      if (fs.existsSync('.env')) {
        let envContent = fs.readFileSync('.env', 'utf8');
        envContent = envContent.replace('USE_POSTGRES=false', 'USE_POSTGRES=true');
        fs.writeFileSync('.env', envContent);
        console.log('Updated .env file to use PostgreSQL');
      }
      
      console.log('Now you can run the database migration with:');
      console.log('  tsx server/dbMigrate.ts');
      console.log('And seed the database with:');
      console.log('  tsx scripts/migrateToNeon.ts');
      return true;
    } else {
      console.error('❌ Failed to create database.');
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    return false;
  }
}

createDatabase();