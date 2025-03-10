import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import GanttChart from "@/components/ui/gantt-chart";
import StatusBadge from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  Plus, 
  Download, 
  RefreshCw, 
  PenSquare, 
  MessageSquare, 
  MoreVertical,
  ClipboardCheck,
  CheckCircle,
  Loader,
  Clock,
} from "lucide-react";

const Dashboard = () => {
  const { toast } = useToast();

  // Fetch statistics for the dashboard cards
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/statistics'],
  });

  // Fetch tasks, allocations, classes, and teachers for gantt chart and task table
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ['/api/allocations'],
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers'],
  });

  // Display error toast if any of the queries fail
  if (statsError) {
    toast({
      title: "Error loading dashboard data",
      description: "Please try again later.",
      variant: "destructive",
    });
  }

  // Loading state for the entire dashboard
  const isLoading = statsLoading || tasksLoading || allocationsLoading || classesLoading || teachersLoading;

  // Handler for export report button
  const handleExportReport = () => {
    toast({
      title: "Report Exported",
      description: "The report has been downloaded successfully.",
    });
  };

  // Handler for create new task button
  const handleCreateTask = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Creating new tasks will be available in the next release.",
    });
  };

  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Task Tracking Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleCreateTask} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create New Task</span>
          </Button>
          <Button onClick={handleExportReport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <ClipboardCheck className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Tasks</p>
                <h3 className="text-2xl font-semibold">
                  {isLoading ? "..." : statsData?.totalTasks}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <CheckCircle className="text-green-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Completed</p>
                <h3 className="text-2xl font-semibold">
                  {isLoading ? "..." : statsData?.tasksByStatus?.Completed || 0}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <Loader className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">In Progress</p>
                <h3 className="text-2xl font-semibold">
                  {isLoading ? "..." : statsData?.tasksByStatus?.["In Progress"] || 0}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-3 mr-4">
                <Clock className="text-yellow-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pending</p>
                <h3 className="text-2xl font-semibold">
                  {isLoading ? "..." : statsData?.tasksByStatus?.["Not Started"] || 0}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Filters */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-grow">
              <div className="sm:w-1/3">
                <label className="block text-sm text-gray-500 mb-1">Teacher</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Teachers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {!teachersLoading && teachers?.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.teacherId}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:w-1/3">
                <label className="block text-sm text-gray-500 mb-1">Course</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {!classesLoading && [...new Set(classes?.map(c => c.course))].map(course => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:w-1/3">
                <label className="block text-sm text-gray-500 mb-1">Status</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-end">
              <Button className="gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-filter"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                <span>Apply Filters</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      {isLoading ? (
        <Card className="mb-6 p-6 flex justify-center items-center h-96">
          <div className="flex flex-col items-center">
            <Loader className="animate-spin h-8 w-8 text-primary mb-2" />
            <p>Loading Gantt chart...</p>
          </div>
        </Card>
      ) : (
        <div className="mb-6">
          <GanttChart 
            allocations={allocations || []}
            tasks={tasks || []}
            classes={classes || []}
            teachers={teachers || []}
          />
        </div>
      )}

      {/* Tasks Table */}
      <Card>
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-semibold">Marking Tasks</h2>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button size="sm" className="gap-2">
              <PenSquare className="h-4 w-4" />
              <span>Bulk Update</span>
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left">
                  <div className="flex items-center">
                    <Checkbox id="select-all" className="mr-3" />
                    <span>Task</span>
                  </div>
                </th>
                <th className="p-3 text-left">Course</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Assigned To</th>
                <th className="p-3 text-left">Due Date</th>
                <th className="p-3 text-left">Progress</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-3 text-center">
                    Loading tasks...
                  </td>
                </tr>
              ) : allocations?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-3 text-center">
                    No tasks found
                  </td>
                </tr>
              ) : (
                allocations?.slice(0, 5).map((allocation) => {
                  const task = tasks?.find(t => t.taskId === allocation.taskId);
                  const classObj = classes?.find(c => c.classId === allocation.classId);
                  const teacher = teachers?.find(t => t.teacherId === allocation.teacherId);
                  
                  if (!task || !classObj || !teacher) return null;
                  
                  return (
                    <tr key={allocation.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center">
                          <Checkbox id={`task-${allocation.id}`} className="mr-3" />
                          <span className="font-medium">{task.name}</span>
                        </div>
                      </td>
                      <td className="p-3">{task.course}</td>
                      <td className="p-3">{classObj.name}</td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm mr-2">
                            {teacher.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span>{teacher.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center w-32">
                          <Progress value={allocation.progress} className="mr-2" />
                          <span className="text-sm">{allocation.progress}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={allocation.status} />
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon">
                            <PenSquare className="h-4 w-4 text-gray-500 hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MessageSquare className="h-4 w-4 text-gray-500 hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-5 flex items-center justify-between border-t">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{isLoading ? "..." : Math.min(allocations?.length || 0, 5)}</span> of <span className="font-medium">{isLoading ? "..." : allocations?.length || 0}</span> entries
          </div>
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-white">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
