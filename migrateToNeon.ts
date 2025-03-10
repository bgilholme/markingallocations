import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';
import * as schema from '../shared/schema';
import { MemStorage } from '../server/storage';

// Load environment variables
dotenv.config();

// Get database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function seedData() {
  // Create Neon SQL client
  const sql = neon(connectionString as string);
  
  // Create Drizzle instance
  const db = drizzle(sql, { schema });
  
  console.log('Starting database seeding...');
  
  try {
    // Get data from memory storage
    const memStorage = new MemStorage();
    
    // Get all data from memory storage
    const teachers = await memStorage.getTeachers();
    const tasks = await memStorage.getTasks();
    const classes = await memStorage.getClasses();
    const allocations = await memStorage.getAllocations();
    
    console.log(`Found ${teachers.length} teachers, ${tasks.length} tasks, ${classes.length} classes, and ${allocations.length} allocations in memory storage`);
    
    // Insert teachers
    console.log('Inserting teachers...');
    for (const teacher of teachers) {
      const { id, ...teacherData } = teacher;
      await db.insert(schema.teachers).values(teacherData);
    }
    
    // Insert tasks
    console.log('Inserting tasks...');
    for (const task of tasks) {
      const { id, ...taskData } = task;
      await db.insert(schema.tasks).values(taskData);
    }
    
    // Insert classes
    console.log('Inserting classes...');
    for (const classItem of classes) {
      const { id, ...classData } = classItem;
      await db.insert(schema.classes).values(classData);
    }
    
    // Insert allocations
    console.log('Inserting allocations...');
    for (const allocation of allocations) {
      const { id, ...allocationData } = allocation;
      await db.insert(schema.allocations).values(allocationData);
    }
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

seedData();