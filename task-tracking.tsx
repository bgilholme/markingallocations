import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  Loader, 
  RefreshCw, 
  PenSquare, 
  MessageSquare, 
  MoreVertical,
  CheckSquare,
  Calendar,
  X
} from "lucide-react";
import { format } from "date-fns";
import { TaskStatus } from "@shared/schema";

const TaskTracking = () => {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    teacher: 'all',
    course: 'all',
    status: 'all'
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [currentAllocation, setCurrentAllocation] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    status: '',
    progress: 0,
    comments: ''
  });

  // Fetch data
  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ['/api/allocations'],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers'],
  });

  const isLoading = allocationsLoading || tasksLoading || classesLoading || teachersLoading;

  // Filter allocations based on selected filters
  const filteredAllocations = allocations?.filter(allocation => {
    if (!classes || !teachers) return false;
    
    const classObj = classes.find(c => c.classId === allocation.classId);
    const teacher = teachers.find(t => t.teacherId === allocation.teacherId);
    
    return (
      (filters.teacher === 'all' || teacher?.teacherId === filters.teacher) &&
      (filters.course === 'all' || classObj?.course === filters.course) &&
      (filters.status === 'all' || allocation.status === filters.status)
    );
  }) || [];

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAllocations.map(allocation => allocation.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle individual checkbox selection
  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  // Handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle opening edit dialog
  const handleEdit = (allocation: any) => {
    setCurrentAllocation(allocation);
    setEditFormData({
      status: allocation.status,
      progress: allocation.progress,
      comments: allocation.comments || ''
    });
    setEditDialogOpen(true);
  };

  // Handle opening comment dialog
  const handleComment = (allocation: any) => {
    setCurrentAllocation(allocation);
    setEditFormData({
      status: allocation.status,
      progress: allocation.progress,
      comments: allocation.comments || ''
    });
    setCommentDialogOpen(true);
  };

  // Handle opening bulk update dialog
  const handleBulkUpdate = () => {
    if (selectedIds.length === 0) {
      toast({
        title: "No tasks selected",
        description: "Please select at least one task to update.",
        variant: "destructive"
      });
      return;
    }
    
    setEditFormData({
      status: '',
      progress: 0,
      comments: ''
    });
    setBulkUpdateDialogOpen(true);
  };

  // Handle edit form changes
  const handleEditFormChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If status changes, update progress accordingly
    if (field === 'status') {
      if (value === TaskStatus.COMPLETED) {
        setEditFormData(prev => ({ ...prev, progress: 100 }));
      } else if (value === TaskStatus.NOT_STARTED) {
        setEditFormData(prev => ({ ...prev, progress: 0 }));
      }
    }
    
    // If progress changes to 100%, update status to completed
    if (field === 'progress' && value === 100) {
      setEditFormData(prev => ({ ...prev, status: TaskStatus.COMPLETED }));
    }
  };

  // Handle submit for edit dialog
  const handleEditSubmit = async () => {
    try {
      await apiRequest('PUT', `/api/allocations/${currentAllocation.id}`, editFormData);
      
      queryClient.invalidateQueries({ queryKey: ['/api/allocations'] });
      
      toast({
        title: "Task updated",
        description: "The task has been updated successfully."
      });
      
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error updating task",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // Handle submit for comment dialog
  const handleCommentSubmit = async () => {
    try {
      await apiRequest('PUT', `/api/allocations/${currentAllocation.id}`, {
        comments: editFormData.comments
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/allocations'] });
      
      toast({
        title: "Comment added",
        description: "The comment has been added successfully."
      });
      
      setCommentDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error adding comment",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // Handle submit for bulk update dialog
  const handleBulkUpdateSubmit = async () => {
    try {
      // Only include fields that have values
      const updateData: any = {};
      if (editFormData.status) updateData.status = editFormData.status;
      if (editFormData.progress > 0) updateData.progress = editFormData.progress;
      if (editFormData.comments) updateData.comments = editFormData.comments;
      
      // If no fields to update, show error
      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No changes to apply",
          description: "Please specify at least one field to update.",
          variant: "destructive"
        });
        return;
      }
      
      await apiRequest('PUT', '/api/allocations/bulk', {
        ids: selectedIds,
        data: updateData
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/allocations'] });
      
      toast({
        title: "Tasks updated",
        description: `${selectedIds.length} tasks have been updated successfully.`
      });
      
      setBulkUpdateDialogOpen(false);
      setSelectedIds([]);
    } catch (error) {
      toast({
        title: "Error updating tasks",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // Handle refresh button
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/allocations'] });
    
    toast({
      title: "Data refreshed",
      description: "The task list has been refreshed."
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Task Tracking</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-grow">
              <div className="sm:w-1/3">
                <label className="block text-sm text-gray-500 mb-1">Teacher</label>
                <Select
                  value={filters.teacher}
                  onValueChange={(value) => handleFilterChange('teacher', value)}
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
              <div className="sm:w-1/3">
                <label className="block text-sm text-gray-500 mb-1">Course</label>
                <Select
                  value={filters.course}
                  onValueChange={(value) => handleFilterChange('course', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {classes && [...new Set(classes.map(c => c.course))].map(course => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:w-1/3">
                <label className="block text-sm text-gray-500 mb-1">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TaskStatus.NOT_STARTED}>Not Started</SelectItem>
                    <SelectItem value={TaskStatus.DELAYED}>Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-semibold">Marking Tasks</h2>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button 
              size="sm" 
              className="gap-2"
              onClick={handleBulkUpdate}
              disabled={selectedIds.length === 0}
            >
              <PenSquare className="h-4 w-4" />
              <span>Bulk Update</span>
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    id="select-all" 
                    onCheckedChange={handleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === filteredAllocations.length}
                  />
                </TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center">
                      <Loader className="h-6 w-6 text-primary animate-spin mb-2" />
                      <span>Loading tasks...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAllocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6">
                    No tasks found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAllocations.map(allocation => {
                  const task = tasks?.find(t => t.taskId === allocation.taskId);
                  const classObj = classes?.find(c => c.classId === allocation.classId);
                  const teacher = teachers?.find(t => t.teacherId === allocation.teacherId);
                  
                  if (!task || !classObj || !teacher) return null;
                  
                  return (
                    <TableRow key={allocation.id}>
                      <TableCell>
                        <Checkbox 
                          id={`task-${allocation.id}`} 
                          checked={selectedIds.includes(allocation.id)}
                          onCheckedChange={(checked) => 
                            handleSelectItem(allocation.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>{task.course}</TableCell>
                      <TableCell>{classObj.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm mr-2">
                            {teacher.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span>{teacher.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {format(new Date(task.dueDate), "MMM d, yyyy")}
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
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(allocation)}
                          >
                            <PenSquare className="h-4 w-4 text-gray-500 hover:text-primary" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleComment(allocation)}
                          >
                            <MessageSquare className="h-4 w-4 text-gray-500 hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-5 flex items-center justify-between border-t">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredAllocations.length}</span> of <span className="font-medium">{filteredAllocations.length}</span> entries
          </div>
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-white">1</Button>
            <Button variant="outline" size="sm" disabled={filteredAllocations.length <= 10}>Next</Button>
          </div>
        </div>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
          </DialogHeader>
          
          {currentAllocation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task:</label>
                <p>{tasks?.find(t => t.taskId === currentAllocation.taskId)?.name}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status:</label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => handleEditFormChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.NOT_STARTED}>Not Started</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={TaskStatus.DELAYED}>Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Progress: {editFormData.progress}%</label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editFormData.progress}
                  onChange={(e) => handleEditFormChange('progress', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Comments:</label>
                <Textarea
                  value={editFormData.comments}
                  onChange={(e) => handleEditFormChange('comments', e.target.value)}
                  rows={3}
                  placeholder="Add any additional comments or notes about this task"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>
          
          {currentAllocation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task:</label>
                <p>{tasks?.find(t => t.taskId === currentAllocation.taskId)?.name}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Comments:</label>
                <Textarea
                  value={editFormData.comments}
                  onChange={(e) => handleEditFormChange('comments', e.target.value)}
                  rows={5}
                  placeholder="Enter comments, feedback, or notes regarding this marking task"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCommentSubmit}>
              Save Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Tasks</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 p-3 rounded-md flex items-start border border-amber-200">
              <div className="text-amber-600 mr-2 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </div>
              <p className="text-sm text-amber-800">
                You are about to update {selectedIds.length} tasks. Only filled fields will be updated.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status (optional):</label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => handleEditFormChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  <SelectItem value={TaskStatus.NOT_STARTED}>Not Started</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={TaskStatus.DELAYED}>Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Progress (optional): {editFormData.progress > 0 ? `${editFormData.progress}%` : "No change"}</label>
              <Input
                type="range"
                min="0"
                max="100"
                step="5"
                value={editFormData.progress}
                onChange={(e) => handleEditFormChange('progress', parseInt(e.target.value))}
                className="w-full"
              />
              {editFormData.progress > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => handleEditFormChange('progress', 0)}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Comment to All (optional):</label>
              <Textarea
                value={editFormData.comments}
                onChange={(e) => handleEditFormChange('comments', e.target.value)}
                rows={3}
                placeholder="This comment will be added to all selected tasks"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdateSubmit}>
              Update {selectedIds.length} Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskTracking;
