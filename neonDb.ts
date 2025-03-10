import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

// Use environment variables for connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Configure Neon
neonConfig.fetchConnectionCache = true;

// Create SQL executor
const sql = neon(connectionString);

// Create Drizzle instance
export const db = drizzle(sql, { schema });