import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  Loader,
  Calendar,
  Edit,
  UserPlus,
  Search
} from "lucide-react";

const StaffingChanges = () => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form fields
  const [formData, setFormData] = useState({
    teacherId: "",
    name: "",
    email: "",
    leaveDates: ""
  });

  // Fetch teachers data
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['/api/teachers'],
  });

  // Filtered teachers based on search query
  const filteredTeachers = teachers?.filter(teacher => 
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.teacherId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open dialog for adding new teacher
  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setFormData({
      teacherId: "",
      name: "",
      email: "",
      leaveDates: ""
    });
    setDialogOpen(true);
  };

  // Open dialog for editing teacher
  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      teacherId: teacher.teacherId,
      name: teacher.name,
      email: teacher.email,
      leaveDates: teacher.leaveDates || ""
    });
    setDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTeacher) {
        // Update existing teacher
        await apiRequest('PUT', `/api/teachers/${editingTeacher.id}`, formData);
        toast({
          title: "Teacher updated",
          description: `${formData.name}'s information has been updated.`
        });
      } else {
        // Create new teacher
        await apiRequest('POST', '/api/teachers', formData);
        toast({
          title: "Teacher added",
          description: `${formData.name} has been added to the system.`
        });
      }
      
      // Refresh teacher data
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      
      // Close dialog
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Staffing Changes</h1>
        <Button onClick={handleAddTeacher} className="gap-2">
          <UserPlus className="h-4 w-4" />
          <span>Add New Teacher</span>
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search teachers by name, email, or ID"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Teacher Information</CardTitle>
        </CardHeader>
        
        {isLoading ? (
          <CardContent className="flex justify-center p-6">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        ) : filteredTeachers?.length === 0 ? (
          <CardContent>
            <p className="text-center text-gray-500">No teachers found matching your search criteria.</p>
          </CardContent>
        ) : (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Leave Dates</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers?.map(teacher => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.teacherId}</TableCell>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                      {teacher.leaveDates ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{teacher.leaveDates}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No leave scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditTeacher(teacher)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
      
      {/* Add/Edit Teacher Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeacher ? `Edit Teacher: ${editingTeacher.name}` : 'Add New Teacher'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teacher ID</label>
                  <Input
                    name="teacherId"
                    value={formData.teacherId}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingTeacher}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Leave Dates</label>
                <Textarea
                  name="leaveDates"
                  value={formData.leaveDates}
                  onChange={handleInputChange}
                  placeholder="Format: YYYY-MM-DD to YYYY-MM-DD, YYYY-MM-DD to YYYY-MM-DD"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Enter date ranges separated by commas. Example: 2023-06-01 to 2023-06-15, 2023-08-10 to 2023-08-20
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffingChanges;
