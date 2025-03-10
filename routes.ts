import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTeacherSchema, insertTaskSchema, insertClassSchema, insertAllocationSchema, TaskStatus } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all teachers
  app.get("/api/teachers", async (req: Request, res: Response) => {
    try {
      const teachers = await storage.getTeachers();
      return res.status(200).json(teachers);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching teachers", error });
    }
  });

  // Get teacher by ID
  app.get("/api/teachers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const teacher = await storage.getTeacher(parseInt(id));
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      return res.status(200).json(teacher);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching teacher", error });
    }
  });

  // Create teacher
  app.post("/api/teachers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(validatedData);
      return res.status(201).json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid teacher data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error creating teacher", error });
    }
  });

  // Update teacher
  app.put("/api/teachers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertTeacherSchema.partial().parse(req.body);
      const teacher = await storage.updateTeacher(parseInt(id), validatedData);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      return res.status(200).json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid teacher data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error updating teacher", error });
    }
  });

  // Delete teacher
  app.delete("/api/teachers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTeacher(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      return res.status(200).json({ message: "Teacher deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting teacher", error });
    }
  });

  // Get all tasks
  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      return res.status(200).json(tasks);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching tasks", error });
    }
  });

  // Get task by ID
  app.get("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const task = await storage.getTask(parseInt(id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      return res.status(200).json(task);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching task", error });
    }
  });

  // Create task
  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      return res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error creating task", error });
    }
  });

  // Update task
  app.put("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(parseInt(id), validatedData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      return res.status(200).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error updating task", error });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTask(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      return res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting task", error });
    }
  });

  // Get all classes
  app.get("/api/classes", async (req: Request, res: Response) => {
    try {
      const classes = await storage.getClasses();
      return res.status(200).json(classes);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching classes", error });
    }
  });

  // Get class by ID
  app.get("/api/classes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const classObj = await storage.getClass(parseInt(id));
      if (!classObj) {
        return res.status(404).json({ message: "Class not found" });
      }
      return res.status(200).json(classObj);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching class", error });
    }
  });

  // Create class
  app.post("/api/classes", async (req: Request, res: Response) => {
    try {
      const validatedData = insertClassSchema.parse(req.body);
      const classObj = await storage.createClass(validatedData);
      return res.status(201).json(classObj);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid class data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error creating class", error });
    }
  });

  // Update class
  app.put("/api/classes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertClassSchema.partial().parse(req.body);
      const classObj = await storage.updateClass(parseInt(id), validatedData);
      if (!classObj) {
        return res.status(404).json({ message: "Class not found" });
      }
      return res.status(200).json(classObj);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid class data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error updating class", error });
    }
  });

  // Delete class
  app.delete("/api/classes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteClass(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Class not found" });
      }
      return res.status(200).json({ message: "Class deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting class", error });
    }
  });

  // Get all allocations
  app.get("/api/allocations", async (req: Request, res: Response) => {
    try {
      const allocations = await storage.getAllocations();
      return res.status(200).json(allocations);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching allocations", error });
    }
  });

  // Get allocation by ID
  app.get("/api/allocations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const allocation = await storage.getAllocation(parseInt(id));
      if (!allocation) {
        return res.status(404).json({ message: "Allocation not found" });
      }
      return res.status(200).json(allocation);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching allocation", error });
    }
  });
  
  // Get allocations by task ID
  app.get("/api/tasks/:taskId/allocations", async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const allocations = await storage.getAllocationsByTaskId(taskId);
      return res.status(200).json(allocations);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching allocations by task", error });
    }
  });

  // Get allocations by teacher ID
  app.get("/api/teachers/:teacherId/allocations", async (req: Request, res: Response) => {
    try {
      const { teacherId } = req.params;
      const allocations = await storage.getAllocationsByTeacherId(teacherId);
      return res.status(200).json(allocations);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching allocations by teacher", error });
    }
  });

  // Create allocation
  app.post("/api/allocations", async (req: Request, res: Response) => {
    try {
      const validatedData = insertAllocationSchema.parse(req.body);
      const allocation = await storage.createAllocation(validatedData);
      return res.status(201).json(allocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid allocation data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error creating allocation", error });
    }
  });

  // Update allocation
  app.put("/api/allocations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertAllocationSchema.partial().parse(req.body);
      const allocation = await storage.updateAllocation(parseInt(id), validatedData);
      if (!allocation) {
        return res.status(404).json({ message: "Allocation not found" });
      }
      return res.status(200).json(allocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid allocation data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error updating allocation", error });
    }
  });

  // Delete allocation
  app.delete("/api/allocations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteAllocation(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Allocation not found" });
      }
      return res.status(200).json({ message: "Allocation deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting allocation", error });
    }
  });

  // Bulk update allocations
  app.put("/api/allocations/bulk", async (req: Request, res: Response) => {
    try {
      const { ids, data } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid IDs provided" });
      }

      const validatedData = insertAllocationSchema.partial().parse(data);

      const updatePromises = ids.map(id => 
        storage.updateAllocation(parseInt(id.toString()), validatedData)
      );

      const results = await Promise.all(updatePromises);
      const updatedCount = results.filter(result => result !== undefined).length;

      return res.status(200).json({ 
        message: `${updatedCount} allocations updated successfully`,
        updatedCount
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid allocation data", errors: error.errors });
      }
      return res.status(500).json({ message: "Error bulk updating allocations", error });
    }
  });

  // Get dashboard statistics
  app.get("/api/statistics", async (req: Request, res: Response) => {
    try {
      const statistics = await storage.getStatistics();
      return res.status(200).json(statistics);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching statistics", error });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
