import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  Loader,
  AlertTriangle
} from "lucide-react";

const MarkerAssignment = () => {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [assignments, setAssignments] = useState<Array<{
    class: any,
    teacher: any,
    allocationId: number | null,
    warning: string | null
  }>>([]);

  // Fetch data
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers'],
  });

  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ['/api/allocations'],
  });

  const isLoading = tasksLoading || classesLoading || teachersLoading || allocationsLoading;

  // Update assignments when a task is selected
  useEffect(() => {
    if (!selectedTask || isLoading) {
      setAssignments([]);
      return;
    }

    // Find the selected task
    const task = tasks?.find(t => t.taskId === selectedTask);
    if (!task) return;

    // Find classes for this task's course
    const courseClasses = classes?.filter(c => c.course === task.course) || [];
    
    // Get existing allocations for this task
    const taskAllocations = allocations?.filter(a => a.taskId === selectedTask) || [];
    
    // Create assignment objects for all classes in this course
    const assignmentsList = courseClasses.map(cls => {
      // Find if there's an existing allocation for this class and task
      const existingAllocation = taskAllocations.find(a => a.classId === cls.classId);
      const teacher = existingAllocation 
        ? teachers?.find(t => t.teacherId === existingAllocation.teacherId) 
        : null;
      
      // Check for warnings
      let warning = null;
      
      if (teacher) {
        // Check if teacher is assigned to their own class
        if (cls.teacherId === teacher.teacherId) {
          warning = "Teacher assigned to mark their own class";
        }
        
        // Check for teacher on leave
        // This is a simplified check - you'd need more sophisticated date parsing
        if (teacher.leaveDates && teacher.leaveDates.length > 0) {
          warning = "Teacher may be on leave during marking period";
        }
      }
      
      return {
        class: cls,
        teacher,
        allocationId: existingAllocation?.id || null,
        warning
      };
    });
    
    setAssignments(assignmentsList);
  }, [selectedTask, tasks, classes, teachers, allocations, isLoading]);

  // Handle task change
  const handleTaskChange = (value: string) => {
    setSelectedTask(value);
  };

  // Handle teacher assignment
  const handleTeacherChange = async (classId: string, teacherId: string) => {
    const assignment = assignments.find(a => a.class.classId === classId);
    if (!assignment) return;
    
    try {
      if (assignment.allocationId) {
        // Update existing allocation
        await apiRequest('PUT', `/api/allocations/${assignment.allocationId}`, {
          teacherId
        });
      } else {
        // Create new allocation
        const task = tasks?.find(t => t.taskId === selectedTask);
        if (!task) return;
        
        // Calculate start and end dates
        const startDate = new Date(task.dueDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 14); // 2 week marking window
        
        await apiRequest('POST', '/api/allocations', {
          taskId: selectedTask,
          classId,
          teacherId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'Not Started',
          progress: 0
        });
      }
      
      // Refresh allocations data
      queryClient.invalidateQueries({ queryKey: ['/api/allocations'] });
      
      toast({
        title: "Teacher assignment updated",
        description: "The marking assignment has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating assignment",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Marker Assignment</h1>
      
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <label className="block text-sm text-gray-500 mb-2">Select Assessment Task:</label>
            <Select 
              value={selectedTask} 
              onValueChange={handleTaskChange}
            >
              <SelectTrigger className="w-full md:w-80">
                <SelectValue placeholder="-- Select a Task --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Select a Task --</SelectItem>
                {!tasksLoading && tasks?.map(task => (
                  <SelectItem key={task.id} value={task.taskId}>
                    {task.name} - {task.course} ({task.yearGroup})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
      
      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle>Assign Markers</CardTitle>
          </CardHeader>
          
          {isLoading ? (
            <CardContent className="flex justify-center p-6">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          ) : assignments.length === 0 ? (
            <CardContent>
              <p className="text-center text-gray-500">No classes found for this task.</p>
            </CardContent>
          ) : (
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Year Group</TableHead>
                    <TableHead>Current Teacher</TableHead>
                    <TableHead>Assigned Marker</TableHead>
                    <TableHead>Warnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map(assignment => {
                    const currentTeacher = teachers?.find(t => t.teacherId === assignment.class.teacherId);
                    
                    return (
                      <TableRow key={assignment.class.id}>
                        <TableCell className="font-medium">{assignment.class.name}</TableCell>
                        <TableCell>{assignment.class.course}</TableCell>
                        <TableCell>{assignment.class.yearGroup}</TableCell>
                        <TableCell>
                          {currentTeacher?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={assignment.teacher?.teacherId || ''}
                            onValueChange={(value) => handleTeacherChange(assignment.class.classId, value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="-- Assign Teacher --" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">-- Assign Teacher --</SelectItem>
                              {teachers?.map(teacher => (
                                <SelectItem key={teacher.id} value={teacher.teacherId}>
                                  {teacher.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {assignment.warning && (
                            <div className="flex items-center text-amber-600">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              <span className="text-sm">{assignment.warning}</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      )}
      
      {!selectedTask && (
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <p className="text-blue-800">Please select an assessment task to begin assigning markers.</p>
        </div>
      )}
    </div>
  );
};

export default MarkerAssignment;
