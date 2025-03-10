import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays, isSameDay, isWithinInterval, isBefore } from "date-fns";
import { Task, Allocation, Class, Teacher, TaskStatus } from "@shared/schema";

interface GanttChartProps {
  allocations: Allocation[];
  tasks: Task[];
  classes: Class[];
  teachers: Teacher[];
  startDate?: Date;
  endDate?: Date;
  dayWidth?: number;
}

const GanttChart: React.FC<GanttChartProps> = ({
  allocations,
  tasks,
  classes,
  teachers,
  startDate: propStartDate,
  endDate: propEndDate,
  dayWidth = 24
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  
  // Calculate date range
  const today = new Date();
  const startDate = propStartDate || today;
  const endDate = propEndDate || addDays(today, 30);
  
  // Generate array of dates between start and end date
  const generateDateRange = () => {
    const dateArray = [];
    let currentDate = new Date(startDate);
    
    while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
      dateArray.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return dateArray;
  };
  
  const dateRange = generateDateRange();
  
  // Check if task bar should render within the date range
  const isTaskInRange = (taskStart: Date, taskEnd: Date) => {
    return (
      isWithinInterval(taskStart, { start: startDate, end: endDate }) ||
      isWithinInterval(taskEnd, { start: startDate, end: endDate }) ||
      (isBefore(taskStart, startDate) && isBefore(endDate, taskEnd))
    );
  };
  
  // Calculate position and width of task bar
  const calculateTaskPosition = (taskStart: Date, taskEnd: Date) => {
    // Calculate days from start date
    const startDiff = Math.max(
      0,
      (new Date(taskStart).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Calculate width based on duration
    const duration = Math.max(
      1,
      (new Date(taskEnd).getTime() - new Date(taskStart).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Adjust width if task extends beyond end date
    const adjustedDuration = Math.min(
      duration,
      dateRange.length - startDiff
    );
    
    return {
      left: startDiff * dayWidth,
      width: adjustedDuration * dayWidth,
    };
  };
  
  // Get task bar background color based on status
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return "bg-green-100";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100";
      case TaskStatus.NOT_STARTED:
        return "bg-yellow-100";
      case TaskStatus.DELAYED:
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };
  
  // Get progress bar color based on status
  const getProgressColor = (status: string) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return "bg-green-500";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-500";
      case TaskStatus.NOT_STARTED:
        return "bg-yellow-500";
      case TaskStatus.DELAYED:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  
  // Check if container is scrollable horizontally
  useEffect(() => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth } = containerRef.current;
      setIsScrollable(scrollWidth > clientWidth);
    }
  }, [allocations, dateRange, dayWidth]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Marking Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="overflow-x-auto">
          <div className="w-full min-w-max">
            {/* Timeline Header */}
            <div className="flex border-b border-gray-200">
              <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2 bg-gray-50"></div>
              <div className="flex flex-grow">
                {dateRange.map((date, index) => (
                  <div 
                    key={index} 
                    className="w-24 flex-shrink-0 text-center py-2 font-medium text-sm border-r border-gray-200"
                    style={{ width: `${dayWidth}px` }}
                  >
                    {format(date, "MMM d")}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Gantt Rows */}
            <div className="gantt-body">
              {allocations.map((allocation) => {
                const task = tasks.find(t => t.taskId === allocation.taskId);
                const classObj = classes.find(c => c.classId === allocation.classId);
                const teacher = teachers.find(t => t.teacherId === allocation.teacherId);
                
                if (!task || !classObj || !teacher) return null;
                
                const taskStart = new Date(allocation.startDate);
                const taskEnd = new Date(allocation.endDate);
                
                if (!isTaskInRange(taskStart, taskEnd)) return null;
                
                const { left, width } = calculateTaskPosition(taskStart, taskEnd);
                const statusColor = getTaskStatusColor(allocation.status);
                const progressColor = getProgressColor(allocation.status);
                
                return (
                  <div 
                    key={allocation.id} 
                    className="flex border-b border-gray-200 hover:bg-gray-50"
                  >
                    <div className="w-48 flex-shrink-0 border-r border-gray-200 p-2">
                      <div className="truncate font-medium">{task.name}</div>
                      <div className="text-xs text-gray-600">{classObj.yearGroup} - {classObj.name}</div>
                    </div>
                    <div className="relative flex-grow h-14">
                      <div 
                        className={`absolute top-2 h-10 ${statusColor} rounded-md flex items-center px-2`}
                        style={{ left: `${left}px`, width: `${width}px` }}
                        title={`${task.name} - ${teacher.name} - ${allocation.status}`}
                      >
                        <div className="w-full bg-gray-300 rounded-full h-1.5">
                          <div 
                            className={`${progressColor} h-1.5 rounded-full`} 
                            style={{ width: `${allocation.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex mt-4 justify-end">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm">In Progress</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-sm">Not Started</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm">Delayed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;
