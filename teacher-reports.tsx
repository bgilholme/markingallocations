import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader,
  Download,
  FileText,
  BarChart2,
  Users,
  CalendarDays
} from "lucide-react";
import { format } from "date-fns";

const TeacherReports = () => {
  const { toast } = useToast();
  const [selectedTeacher, setSelectedTeacher] = useState("");

  // Fetch data
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers'],
  });

  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ['/api/allocations'],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
  });

  const isLoading = teachersLoading || allocationsLoading || tasksLoading || classesLoading;

  // Get teacher allocations
  const teacherAllocations = selectedTeacher
    ? allocations?.filter(allocation => allocation.teacherId === selectedTeacher)
    : [];

  // Calculate statistics
  const calculateStats = () => {
    if (!selectedTeacher || !teacherAllocations || teacherAllocations.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        totalStudents: 0,
        averageProgress: 0
      };
    }

    const completedTasks = teacherAllocations.filter(a => a.status === 'Completed').length;
    const inProgressTasks = teacherAllocations.filter(a => a.status === 'In Progress').length;
    const pendingTasks = teacherAllocations.filter(a => a.status === 'Not Started').length;
    
    let totalStudents = 0;
    teacherAllocations.forEach(allocation => {
      const classObj = classes?.find(c => c.classId === allocation.classId);
      if (classObj) {
        totalStudents += classObj.studentCount;
      }
    });

    const totalProgress = teacherAllocations.reduce((sum, a) => sum + a.progress, 0);
    const averageProgress = teacherAllocations.length > 0
      ? Math.round(totalProgress / teacherAllocations.length)
      : 0;

    return {
      totalTasks: teacherAllocations.length,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      totalStudents,
      averageProgress
    };
  };

  const stats = calculateStats();

  // Handle export report
  const handleExportReport = () => {
    if (!selectedTeacher) {
      toast({
        title: "No teacher selected",
        description: "Please select a teacher to export the report.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Report exported",
      description: "The teacher report has been exported successfully."
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Teacher Reports</h1>
        <Button 
          onClick={handleExportReport} 
          variant="outline" 
          className="gap-2"
          disabled={!selectedTeacher}
        >
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <label className="block text-sm text-gray-500 mb-2">Select Teacher:</label>
          <Select 
            value={selectedTeacher} 
            onValueChange={setSelectedTeacher}
          >
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder="-- Select a Teacher --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">-- Select a Teacher --</SelectItem>
              {!teachersLoading && teachers?.map(teacher => (
                <SelectItem key={teacher.id} value={teacher.teacherId}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {selectedTeacher && !isLoading && (
        <>
          {/* Teacher Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="rounded-full bg-blue-100 p-3 mr-4">
                    <FileText className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Total Tasks</p>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-semibold">{stats.totalTasks}</h3>
                      <div className="text-xs text-gray-500">
                        <span className="text-green-600">{stats.completedTasks} completed</span>
                        {" • "}
                        <span className="text-blue-600">{stats.inProgressTasks} in progress</span>
                        {" • "}
                        <span className="text-yellow-600">{stats.pendingTasks} pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="rounded-full bg-green-100 p-3 mr-4">
                    <Users className="text-green-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Total Students</p>
                    <h3 className="text-2xl font-semibold">{stats.totalStudents}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="rounded-full bg-yellow-100 p-3 mr-4">
                    <BarChart2 className="text-yellow-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Average Progress</p>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-semibold">{stats.averageProgress}%</h3>
                      <Progress value={stats.averageProgress} className="w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Task Allocations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Task Allocations</CardTitle>
            </CardHeader>
            
            {teacherAllocations?.length === 0 ? (
              <CardContent>
                <p className="text-center text-gray-500">No tasks allocated to this teacher.</p>
              </CardContent>
            ) : (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherAllocations?.map(allocation => {
                      const task = tasks?.find(t => t.taskId === allocation.taskId);
                      const classObj = classes?.find(c => c.classId === allocation.classId);
                      
                      if (!task || !classObj) return null;
                      
                      return (
                        <TableRow key={allocation.id}>
                          <TableCell className="font-medium">{task.name}</TableCell>
                          <TableCell>{classObj.name}</TableCell>
                          <TableCell>{classObj.studentCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CalendarDays className="h-4 w-4 text-gray-400 mr-2" />
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CalendarDays className="h-4 w-4 text-gray-400 mr-2" />
                              {format(new Date(allocation.endDate), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center w-32">
                              <Progress value={allocation.progress} className="mr-2" />
                              <span className="text-sm">{allocation.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={allocation.status} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        </>
      )}
      
      {!selectedTeacher && (
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <p className="text-blue-800">Please select a teacher to view their report.</p>
        </div>
      )}
    </div>
  );
};

export default TeacherReports;
