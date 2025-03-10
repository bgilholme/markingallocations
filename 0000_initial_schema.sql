-- Initial schema migration

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  teacher_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  leave_dates TEXT NOT NULL DEFAULT '',
  class_allocations TEXT NOT NULL DEFAULT ''
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  task_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  year_group TEXT NOT NULL,
  due_date TIMESTAMP NOT NULL,
  markers_required INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Not Started'
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  class_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  year_group TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  student_count INTEGER NOT NULL
);

-- Create allocations table
CREATE TABLE IF NOT EXISTS allocations (
  id SERIAL PRIMARY KEY,
  task_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'Not Started',
  progress INTEGER NOT NULL DEFAULT 0,
  comments TEXT NOT NULL DEFAULT ''
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_classes_class_id ON classes(class_id);
CREATE INDEX IF NOT EXISTS idx_allocations_task_id ON allocations(task_id);
CREATE INDEX IF NOT EXISTS idx_allocations_teacher_id ON allocations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_allocations_class_id ON allocations(class_id);