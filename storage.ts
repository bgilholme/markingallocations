import { 
  teachers, Teacher, InsertTeacher, 
  tasks, Task, InsertTask, 
  classes, Class, InsertClass, 
  allocations, Allocation, InsertAllocation,
  TaskStatus
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Teacher operations
  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeacherByTeacherId(teacherId: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: number): Promise<boolean>;

  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  getTaskByTaskId(taskId: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Class operations
  getClasses(): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  getClassByClassId(classId: string): Promise<Class | undefined>;
  createClass(classObj: InsertClass): Promise<Class>;
  updateClass(id: number, classObj: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;

  // Allocation operations
  getAllocations(): Promise<Allocation[]>;
  getAllocation(id: number): Promise<Allocation | undefined>;
  getAllocationsByTaskId(taskId: string): Promise<Allocation[]>;
  getAllocationsByTeacherId(teacherId: string): Promise<Allocation[]>;
  createAllocation(allocation: InsertAllocation): Promise<Allocation>;
  updateAllocation(id: number, allocation: Partial<InsertAllocation>): Promise<Allocation | undefined>;
  deleteAllocation(id: number): Promise<boolean>;
  
  // Dashboard statistics
  getStatistics(): Promise<{
    totalTeachers: number;
    totalTasks: number;
    totalClasses: number;
    totalAllocations: number;
    tasksByStatus: { [key: string]: number };
    upcomingTasks: Task[];
    teacherLoads: Array<{ teacher: Teacher; taskCount: number; studentCount: number; }>;
  }>;
}

// Storage factory function to create the appropriate storage implementation
export function createStorage(): IStorage {
  // Check if we should use Postgres (cloud) or in-memory storage
  // Note: require is used to avoid import issues when NeonStorage is not needed
  try {
    if (process.env.USE_POSTGRES === 'true') {
      console.log('Using PostgreSQL database');
      const { NeonStorage } = require('./neonStorage');
      return new NeonStorage();
    }
  } catch (error) {
    console.error('Failed to initialize PostgreSQL database, falling back to memory storage', error);
  }
  
  console.log('Using in-memory storage');
  return new MemStorage();
}

export class MemStorage implements IStorage {
  private teachers: Map<number, Teacher>;
  private tasks: Map<number, Task>;
  private classes: Map<number, Class>;
  private allocations: Map<number, Allocation>;
  private teacherIdCounter: number;
  private taskIdCounter: number;
  private classIdCounter: number;
  private allocationIdCounter: number;

  constructor() {
    this.teachers = new Map();
    this.tasks = new Map();
    this.classes = new Map();
    this.allocations = new Map();
    this.teacherIdCounter = 1;
    this.taskIdCounter = 1;
    this.classIdCounter = 1;
    this.allocationIdCounter = 1;
    
    // Add some initial data for development
    this.initializeSampleData();
  }

  // Teacher operations
  async getTeachers(): Promise<Teacher[]> {
    return Array.from(this.teachers.values());
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async getTeacherByTeacherId(teacherId: string): Promise<Teacher | undefined> {
    return Array.from(this.teachers.values()).find(
      (teacher) => teacher.teacherId === teacherId
    );
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const id = this.teacherIdCounter++;
    // Ensure all required fields have default values
    const newTeacher: Teacher = { 
      ...teacher, 
      id,
      leaveDates: teacher.leaveDates || '',
      classAllocations: teacher.classAllocations || '',
    };
    this.teachers.set(id, newTeacher);
    return newTeacher;
  }

  async updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const existingTeacher = this.teachers.get(id);
    if (!existingTeacher) return undefined;
    
    const updatedTeacher = { ...existingTeacher, ...teacher };
    this.teachers.set(id, updatedTeacher);
    return updatedTeacher;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    return this.teachers.delete(id);
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTaskByTaskId(taskId: string): Promise<Task | undefined> {
    return Array.from(this.tasks.values()).find(
      (task) => task.taskId === taskId
    );
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    // Ensure all required fields have default values
    const newTask: Task = { 
      ...task, 
      id,
      status: task.status || TaskStatus.NOT_STARTED 
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...task };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Class operations
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getClassByClassId(classId: string): Promise<Class | undefined> {
    return Array.from(this.classes.values()).find(
      (classObj) => classObj.classId === classId
    );
  }

  async createClass(classObj: InsertClass): Promise<Class> {
    const id = this.classIdCounter++;
    const newClass: Class = { ...classObj, id };
    this.classes.set(id, newClass);
    return newClass;
  }

  async updateClass(id: number, classObj: Partial<InsertClass>): Promise<Class | undefined> {
    const existingClass = this.classes.get(id);
    if (!existingClass) return undefined;
    
    const updatedClass = { ...existingClass, ...classObj };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  async deleteClass(id: number): Promise<boolean> {
    return this.classes.delete(id);
  }

  // Allocation operations
  async getAllocations(): Promise<Allocation[]> {
    return Array.from(this.allocations.values());
  }

  async getAllocation(id: number): Promise<Allocation | undefined> {
    return this.allocations.get(id);
  }

  async getAllocationsByTaskId(taskId: string): Promise<Allocation[]> {
    return Array.from(this.allocations.values()).filter(
      (allocation) => allocation.taskId === taskId
    );
  }

  async getAllocationsByTeacherId(teacherId: string): Promise<Allocation[]> {
    return Array.from(this.allocations.values()).filter(
      (allocation) => allocation.teacherId === teacherId
    );
  }

  async createAllocation(allocation: InsertAllocation): Promise<Allocation> {
    const id = this.allocationIdCounter++;
    // Ensure all required fields have default values
    const newAllocation: Allocation = { 
      ...allocation, 
      id,
      status: allocation.status || TaskStatus.NOT_STARTED,
      progress: allocation.progress !== undefined ? allocation.progress : 0,
      comments: allocation.comments || ''
    };
    this.allocations.set(id, newAllocation);
    return newAllocation;
  }

  async updateAllocation(id: number, allocation: Partial<InsertAllocation>): Promise<Allocation | undefined> {
    const existingAllocation = this.allocations.get(id);
    if (!existingAllocation) return undefined;
    
    const updatedAllocation = { ...existingAllocation, ...allocation };
    this.allocations.set(id, updatedAllocation);
    return updatedAllocation;
  }

  async deleteAllocation(id: number): Promise<boolean> {
    return this.allocations.delete(id);
  }

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

    // Count tasks by status
    const tasksByStatus: Record<string, number> = {
      [TaskStatus.NOT_STARTED]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.COMPLETED]: 0,
      [TaskStatus.DELAYED]: 0,
    };

    allTasks.forEach(task => {
      if (tasksByStatus[task.status] !== undefined) {
        tasksByStatus[task.status]++;
      } else {
        tasksByStatus[task.status] = 1;
      }
    });

    // Get upcoming tasks (due in next 14 days)
    const today = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);

    const upcomingTasks = allTasks
      .filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= twoWeeksLater;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    // Calculate marking load per teacher
    const teacherLoads = allTeachers.map(teacher => {
      const teacherAllocations = allAllocations.filter(allocation => 
        allocation.teacherId === teacher.teacherId
      );
      
      let studentCount = 0;
      
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
    }).sort((a, b) => b.studentCount - a.studentCount);

    return {
      totalTeachers: allTeachers.length,
      totalTasks: allTasks.length,
      totalClasses: allClasses.length,
      totalAllocations: allAllocations.length,
      tasksByStatus,
      upcomingTasks,
      teacherLoads: teacherLoads.slice(0, 10) // Top 10 teachers by load
    };
  }

  private initializeSampleData() {
    // Add sample teachers
    const teachers = [
      { teacherId: 'T001', name: 'John Smith', email: 'john.smith@school.edu', leaveDates: '', classAllocations: '' },
      { teacherId: 'T002', name: 'Sarah Johnson', email: 'sarah.johnson@school.edu', leaveDates: '', classAllocations: '' },
      { teacherId: 'T003', name: 'Michael Brown', email: 'michael.brown@school.edu', leaveDates: '', classAllocations: '' },
      { teacherId: 'T004', name: 'Amelia Wilson', email: 'amelia.wilson@school.edu', leaveDates: '', classAllocations: '' },
    ] as InsertTeacher[];

    teachers.forEach(teacher => {
      this.createTeacher(teacher);
    });

    // Add sample classes
    const classes = [
      { classId: 'C001', name: 'Year 10 - Class A', course: 'Mathematics', yearGroup: 'Year 10', teacherId: 'T001', studentCount: 25 },
      { classId: 'C002', name: 'Year 11 - Class B', course: 'English', yearGroup: 'Year 11', teacherId: 'T002', studentCount: 28 },
      { classId: 'C003', name: 'Year 9 - Class C', course: 'Science', yearGroup: 'Year 9', teacherId: 'T003', studentCount: 22 },
      { classId: 'C004', name: 'Year 12 - Class D', course: 'History', yearGroup: 'Year 12', teacherId: 'T004', studentCount: 20 },
    ] as InsertClass[];

    classes.forEach(classObj => {
      this.createClass(classObj);
    });

    // Add sample tasks
    const now = new Date();
    const tasks = [
      { 
        taskId: 'TASK001', 
        name: 'Mathematics Assessment', 
        course: 'Mathematics', 
        yearGroup: 'Year 10', 
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15), 
        markersRequired: 1, 
        status: TaskStatus.IN_PROGRESS 
      },
      { 
        taskId: 'TASK002', 
        name: 'English Essay', 
        course: 'English', 
        yearGroup: 'Year 11', 
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8), 
        markersRequired: 1, 
        status: TaskStatus.COMPLETED 
      },
      { 
        taskId: 'TASK003', 
        name: 'Science Project', 
        course: 'Science', 
        yearGroup: 'Year 9', 
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20), 
        markersRequired: 1, 
        status: TaskStatus.NOT_STARTED 
      },
      { 
        taskId: 'TASK004', 
        name: 'History Essay', 
        course: 'History', 
        yearGroup: 'Year 12', 
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5), 
        markersRequired: 1, 
        status: TaskStatus.DELAYED 
      },
    ] as InsertTask[];

    tasks.forEach(task => {
      this.createTask(task);
    });

    // Add sample allocations
    const allocations = [
      { 
        taskId: 'TASK001', 
        teacherId: 'T002', 
        classId: 'C001', 
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15), 
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 29), 
        status: TaskStatus.IN_PROGRESS,
        progress: 50,
        comments: '' 
      },
      { 
        taskId: 'TASK002', 
        teacherId: 'T001', 
        classId: 'C002', 
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8), 
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 22), 
        status: TaskStatus.COMPLETED,
        progress: 100,
        comments: 'All marking completed ahead of schedule.' 
      },
      { 
        taskId: 'TASK003', 
        teacherId: 'T004', 
        classId: 'C003', 
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20), 
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 34), 
        status: TaskStatus.NOT_STARTED,
        progress: 20,
        comments: 'Will start after completion of Year 12 essays.' 
      },
      { 
        taskId: 'TASK004', 
        teacherId: 'T003', 
        classId: 'C004', 
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5), 
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 19), 
        status: TaskStatus.DELAYED,
        progress: 75,
        comments: 'Delayed due to unexpected extra classes.' 
      },
    ] as InsertAllocation[];

    allocations.forEach(allocation => {
      this.createAllocation(allocation);
    });
  }
}

// Export the storage instance
export const storage = createStorage();
