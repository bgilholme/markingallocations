// Run the migration script with Neon configuration
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_Pm65JBWDVzIu@ep-empty-wave-a8ysz8n9-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";
process.env.USE_NEON_DB = "true";

// Execute the migration script
require('../server/dbMigrate.ts');