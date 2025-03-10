# Marking Maestro - Teacher Task Tracking System

A comprehensive task tracking system for teachers to manage and visualize marking assignments with dashboard and Gantt visualization.

## Features

- Dashboard with marking statistics and teacher workload analytics
- Interactive Gantt chart for visualizing marking timelines
- Task tracking with status updates and progress monitoring
- Teacher allocation and workload management
- Class management with student counts
- PostgreSQL database integration for data persistence

## Technology Stack

- **Frontend**: React, TypeScript, Shadcn UI, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Charts**: Recharts
- **Gantt Chart**: dhtmlx-gantt

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables (create a `.env` file with database credentials)
4. Start the development server:
   ```
   npm run dev
   ```

## Database Configuration

### Using In-Memory Database (Default)

The application uses an in-memory database by default, which is perfect for development and testing. No additional configuration is needed.

### Using PostgreSQL Database

To use a PostgreSQL database (like Neon), follow these steps:

1. Create a PostgreSQL database
2. Add the connection string to your `.env` file:
   ```
   DATABASE_URL=postgres://username:password@hostname:port/database
   ```
3. Run database migrations:
   ```
   ./scripts/db-commands.sh migrate
   ```
4. Seed the database with sample data (optional):
   ```
   ./scripts/db-commands.sh seed
   ```

## Database Management Commands

The application includes several commands for database management:

```
./scripts/db-commands.sh [command]
```

Available commands:
- `migrate`: Run database migrations
- `seed`: Seed the database with sample data
- `status`: Check database connection status
- `help`: Show help message

## Application Modules

- **Dashboard**: Overview of task statistics and teacher workloads
- **Task Tracking**: Manage marking tasks and track progress
- **Teacher Assignment**: Allocate teachers to marking tasks
- **Gantt View**: Visualize marking timelines
- **Reports**: Generate teacher workload reports

## License

[MIT License](LICENSE)