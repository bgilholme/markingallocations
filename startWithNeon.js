// Script to start the application with Neon database connection
require('dotenv').config();

// Set USE_NEON_DB to true before starting the app
process.env.USE_NEON_DB = 'true';

// Import and run the main server file
require('tsx')('./server/index.ts');