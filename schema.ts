import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Teachers table for storing teacher information
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  teacherId: text("teacher_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  leaveDates: text("leave_dates").default("").notNull(),
  classAllocations: text("class_allocations").default("").notNull(),
});

// Task table for storing assessment tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").notNull().unique(),
  name: text("name").notNull(),
  course: text("course").notNull(),
  yearGroup: text("year_group").notNull(),
  dueDate: timestamp("due_date").notNull(),
  markersRequired: integer("markers_required").notNull(),
  status: text("status").notNull().default("Not Started"),
});

// Class table for storing class information
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  classId: text("class_id").notNull().unique(),
  name: text("name").notNull(),
  course: text("course").notNull(),
  yearGroup: text("year_group").notNull(),
  teacherId: text("teacher_id").notNull(),
  studentCount: integer("student_count").notNull(),
});

// Allocation table for storing task allocations
export const allocations = pgTable("allocations", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").notNull(),
  teacherId: text("teacher_id").notNull(),
  classId: text("class_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("Not Started"),
  progress: integer("progress").notNull().default(0),
  comments: text("comments").default("").notNull(),
});

// Insert schemas
export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true });
export const insertAllocationSchema = createInsertSchema(allocations).omit({ id: true });

// Types
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Allocation = typeof allocations.$inferSelect;
export type InsertAllocation = z.infer<typeof insertAllocationSchema>;

// Status types
export const TaskStatus = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DELAYED: "Delayed",
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];
