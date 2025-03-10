# Task Tracking Module for Marking Maestro

This module provides comprehensive tracking and visualization of marking tasks assigned to teachers. It includes a dashboard view for detailed task management and a Gantt chart for timeline visualization.

## Features

- **Task Dashboard**
  - View all assigned marking tasks
  - Filter tasks by status and other criteria
  - Update task status, completion percentage, and add comments
  - Bulk update multiple tasks at once
  - View personal task summary statistics
  - Monitor progress of specific assessment tasks

- **Gantt Chart Visualization**
  - Timeline visualization of all marking tasks
  - Filter by teacher, course, or year group
  - Color-coded task status
  - Multiple view modes (day, week, month, etc.)
  - Export chart as PNG

## Setup

### Prerequisites

- Python 3.8+
- Node.js 14+
- Flask
- React
- SQL database (PostgreSQL recommended, SQLite for development)

### Backend Setup

1. Install the required Python packages:

```bash
pip install flask flask-sqlalchemy flask-cors psycopg2-binary
```

2. Set up the environment variable for the database:

```bash
# For PostgreSQL
export DATABASE_URL=postgresql://username:password@localhost/marking_maestro

# For SQLite (development)
export DATABASE_URL=sqlite:///marking_maestro.db
```

3. Initialize the database:

```bash
flask db upgrade
```

4. Seed the database with sample data:

```bash
python scripts/seed_task_tracking.py
```

5. Run the Flask backend:

```bash
flask run --port=5000
```

### Frontend Setup

1. Install the required npm packages:

```bash
npm install antd moment axios frappe-gantt-react react-component-export-image
```

2. Add the CSS styles for the Gantt chart:

```bash
# Copy the GanttChart.css file to your src/styles directory
```

3. Import and use the TaskTrackingMain component in your application:

```jsx
import TaskTrackingMain from './components/TaskTracking/TaskTrackingMain';

// Then in your JSX
<TaskTrackingMain />
```

## Usage

### Dashboard View

The dashboard view provides:

1. **Task List**: View all tasks assigned to you (or all tasks if you're an admin)
   - Status indicators (Completed, In Progress, Not Started, etc.)
   - Progress bars for each task
   - Due dates and marking deadlines
   - Update buttons for changing task status

2. **My Summary** (for teachers): View your personal task statistics
   - Total tasks assigned
   - Completed and in-progress tasks
   - Overdue tasks
   - Overall completion rate