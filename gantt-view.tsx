import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GanttChart from "@/components/ui/gantt-chart";
import { 
  Loader,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { addMonths, format } from "date-fns";

const GanttView = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    teacher: 'all',
    course: 'all',
    yearGroup: 'all',
  });
  const [timeframe, setTimeframe] = useState({
    start: new Date(),
    end: addMonths(new Date(), 2),
  });

  // Fetch data for Gantt chart
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: allocations, isLoading: allocationsLoading, error: allocationsError } = useQuery({
    queryKey: ['/api/allocations'],
  });

  const { data: classes, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: teachers, isLoading: teachersLoading, error: teachersError } = useQuery({
    queryKey: ['/api/teachers'],
  });

  // Check for errors
  const error = tasksError || allocationsError || classesError || teachersError;
  if (error) {
    toast({
      title: "Error loading Gantt chart data",
      description: "Please try again later.",
      variant: "destructive",
    });
  }

  // Filter the allocations based on selected filters
  const filteredAllocations = allocations?.filter(allocation => {
    if (!classes || !teachers) return false;
    
    const classObj = classes.find(c => c.classId === allocation.classId);
    const teacher = teachers.find(t => t.teacherId === allocation.teacherId);
    
    return (
      (filters.teacher === 'all' || teacher?.teacherId === filters.teacher) &&
      (filters.course === 'all' || classObj?.course === filters.course) &&
      (filters.yearGroup === 'all' || classObj?.yearGroup === filters.yearGroup)
    );
  });

  // Loading state
  const isLoading = tasksLoading || allocationsLoading || classesLoading || teachersLoading;

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle export
  const handleExport = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Exporting the Gantt chart will be available in the next release.",
    });
  };

  // Extract unique courses and year groups for filters
  const uniqueCourses = classes ? [...new Set(classes.map(c => c.course))] : [];
  const uniqueYearGroups = classes ? [...new Set(classes.map(c => c.yearGroup))] : [];

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Marking Allocation Gantt Chart</h1>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span>Export Chart</span>
          </Button>
        </div>
      </div>

      {/* Filter controls */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Teacher</label>
              <Select 
                onValueChange={(value) => handleFilterChange('teacher', value)}
                value={filters.teacher}
              >
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
            
            <div>
              <label className="block text-sm text-gray-500 mb-1">Course</label>
              <Select 
                onValueChange={(value) => handleFilterChange('course', value)}
                value={filters.course}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {uniqueCourses.map(course => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-500 mb-1">Year Group</label>
              <Select 
                onValueChange={(value) => handleFilterChange('yearGroup', value)}
                value={filters.yearGroup}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Year Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Year Groups</SelectItem>
                  {uniqueYearGroups.map(yearGroup => (
                    <SelectItem key={yearGroup} value={yearGroup}>
                      {yearGroup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-500 mb-1">Time Range</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{format(timeframe.start, "MMM d")} - {format(timeframe.end, "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      {isLoading ? (
        <Card className="p-6 flex justify-center items-center h-96">
          <div className="flex flex-col items-center">
            <Loader className="animate-spin h-8 w-8 text-primary mb-2" />
            <p>Loading Gantt chart...</p>
          </div>
        </Card>
      ) : (
        <GanttChart 
          allocations={filteredAllocations || []}
          tasks={tasks || []}
          classes={classes || []}
          teachers={teachers || []}
          startDate={timeframe.start}
          endDate={timeframe.end}
        />
      )}
    </div>
  );
};

export default GanttView;
