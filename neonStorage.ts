import { eq } from "drizzle-orm";
import { db } from "./neonDb";
import { 
  teachers, Teacher, InsertTeacher, 
  tasks, Task, InsertTask, 
  classes, Class, InsertClass, 
  allocations, Allocation, InsertAllocation,
  TaskStatus
} from "@shared/schema";
import { IStorage } from "./storage";

export class NeonStorage implements IStorage {
  
  // Teacher operations
  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers);
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const result = await db.select().from(teachers).where(eq(teachers.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getTeacherByTeacherId(teacherId: string): Promise<Teacher | undefined> {
    const result = await db.select().from(teachers).where(eq(teachers.teacherId, teacherId));
    return result.length > 0 ? result[0] : undefined;
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const result = await db.insert(teachers).values(teacher).returning();
    return result[0];
  }

  async updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const result = await db.update(teachers)
      .set(teacher)
      .where(eq(teachers.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const result = await db.delete(teachers).where(eq(teachers.id, id)).returning();
    return result.length > 0;
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getTaskByTaskId(taskId: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.taskId, taskId));
    return result.length > 0 ? result[0] : undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks)
      .set(task)
      .where(eq(tasks.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  // Class operations
  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  async getClass(id: number): Promise<Class | undefined> {
    const result = await db.select().from(classes).where(eq(classes.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getClassByClassId(classId: string): Promise<Class | undefined> {
    const result = await db.select().from(classes).where(eq(classes.classId, classId));
    return result.length > 0 ? result[0] : undefined;
  }

  async createClass(classObj: InsertClass): Promise<Class> {
    const result = await db.insert(classes).values(classObj).returning();
    return result[0];
  }

  async updateClass(id: number, classObj: Partial<InsertClass>): Promise<Class | undefined> {
    const result = await db.update(classes)
      .set(classObj)
      .where(eq(classes.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(classes).where(eq(classes.id, id)).returning();
    return result.length > 0;
  }

  // Allocation operations
  async getAllocations(): Promise<Allocation[]> {
    return await db.select().from(allocations);
  }

  async getAllocation(id: number): Promise<Allocation | undefined> {
    const result = await db.select().from(allocations).where(eq(allocations.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getAllocationsByTaskId(taskId: string): Promise<Allocation[]> {
    return await db.select().from(allocations).where(eq(allocations.taskId, taskId));
  }

  async getAllocationsByTeacherId(teacherId: string): Promise<Allocation[]> {
    return await db.select().from(allocations).where(eq(allocations.teacherId, teacherId));
  }

  async createAllocation(allocation: InsertAllocation): Promise<Allocation> {
    const result = await db.insert(allocations).values(allocation).returning();
    return result[0];
  }

  async updateAllocation(id: number, allocation: Partial<InsertAllocation>): Promise<Allocation | undefined> {
    const result = await db.update(allocations)
      .set(allocation)
      .where(eq(allocations.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteAllocation(id: number): Promise<boolean> {
    const result = await db.delete(allocations).where(eq(allocations.id, id)).returning();
    return result.length > 0;
  }

  // Dashboard statistics
  async getStatistics(): Promise<{
    totalTeachers: number;
    totalTasks: number;
    totalClasses: number;
    totalAllocations: number;
    tasksByStatus: { [key: string]: number };
    upcomingTasks: Task[];
    teacherLoads: Array<{ teacher: Teacher; taskCount: number; studentCount: number; }>;
  }> {
    const allTeachers = await this.getTeachers();
    const allTasks = await this.getTasks();
    const allClasses = await this.getClasses();
    const allAllocations = await this.getAllocations();

    // Calculate tasks by status
    const tasksByStatus: { [key: string]: number } = {
      [TaskStatus.NOT_STARTED]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.COMPLETED]: 0,
      [TaskStatus.DELAYED]: 0,
    };
    
    allTasks.forEach(task => {
      if (tasksByStatus[task.status]) {
        tasksByStatus[task.status]++;
      } else {
        tasksByStatus[task.status] = 1;
      }
    });

    // Get upcoming tasks (due in next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingTasks = allTasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate <= nextWeek;
    });

    // Calculate teacher loads
    const teacherLoads = await Promise.all(
      allTeachers.map(async (teacher) => {
        const teacherAllocations = await this.getAllocationsByTeacherId(teacher.teacherId);
        let studentCount = 0;
        
        // Calculate total students assigned to this teacher
        teacherAllocations.forEach(allocation => {
          const classObj = allClasses.find(c => c.classId === allocation.classId);
          if (classObj) {
            studentCount += classObj.studentCount;
          }
        });
        
        return {
          teacher,
          taskCount: teacherAllocations.length,
          studentCount
        };
      })
    );

    return {
      totalTeachers: allTeachers.length,
      totalTasks: allTasks.length,
      totalClasses: allClasses.length,
      totalAllocations: allAllocations.length,
      tasksByStatus,
      upcomingTasks,
      teacherLoads
    };
  }
}