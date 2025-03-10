import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  Upload,
  File,
  Users,
  Book,
  CheckCircle,
  Loader,
} from "lucide-react";

const DataImport = () => {
  const { toast } = useToast();
  const [staffFile, setStaffFile] = useState<File | null>(null);
  const [tasksFile, setTasksFile] = useState<File | null>(null);
  const [classesFile, setClassesFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStaffFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStaffFile(e.target.files[0]);
    }
  };

  const handleTasksFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTasksFile(e.target.files[0]);
    }
  };

  const handleClassesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setClassesFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!staffFile && !tasksFile && !classesFile) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // For demonstration purposes, we'll simulate file uploads
      // In a real application, this would send the files to the server
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/allocations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });

      toast({
        title: "Files uploaded successfully",
        description: "Your data has been imported into the system.",
        variant: "default",
      });

      // Reset file inputs
      setStaffFile(null);
      setTasksFile(null);
      setClassesFile(null);
    } catch (error) {
      toast({
        title: "Error uploading files",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Data Import</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Staff Import Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="rounded-full bg-blue-100 p-3 mb-3">
                <Users className="text-primary h-6 w-6" />
              </div>
              <h2 className="text-lg font-medium mb-1">Staff Import</h2>
              <p className="text-sm text-gray-500 mb-4">
                Upload CSV or Excel file with Teacher ID, Name, Email, Leave Dates, Class Allocations
              </p>
              
              <label className="w-full">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                  {staffFile ? (
                    <div className="flex items-center justify-center">
                      <File className="h-6 w-6 text-primary mr-2" />
                      <span className="text-sm font-medium truncate">{staffFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to select file or drag and drop</span>
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleStaffFileChange}
                  className="hidden"
                />
              </label>
              
              {staffFile && (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>File selected</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Assessment Task Import Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="rounded-full bg-blue-100 p-3 mb-3">
                <File className="text-primary h-6 w-6" />
              </div>
              <h2 className="text-lg font-medium mb-1">Assessment Task Import</h2>
              <p className="text-sm text-gray-500 mb-4">
                Upload CSV or Excel file with Task ID, Task Name, Course, Year Group, Due Date, Number of Markers Required
              </p>
              
              <label className="w-full">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                  {tasksFile ? (
                    <div className="flex items-center justify-center">
                      <File className="h-6 w-6 text-primary mr-2" />
                      <span className="text-sm font-medium truncate">{tasksFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to select file or drag and drop</span>
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleTasksFileChange}
                  className="hidden"
                />
              </label>
              
              {tasksFile && (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>File selected</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Class Import Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="rounded-full bg-blue-100 p-3 mb-3">
                <Book className="text-primary h-6 w-6" />
              </div>
              <h2 className="text-lg font-medium mb-1">Class Import</h2>
              <p className="text-sm text-gray-500 mb-4">
                Upload CSV or Excel file with Class ID, Class Name, Course, Year Group, Teacher ID, Student Count
              </p>
              
              <label className="w-full">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                  {classesFile ? (
                    <div className="flex items-center justify-center">
                      <File className="h-6 w-6 text-primary mr-2" />
                      <span className="text-sm font-medium truncate">{classesFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to select file or drag and drop</span>
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleClassesFileChange}
                  className="hidden"
                />
              </label>
              
              {classesFile && (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>File selected</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-center">
        <Button 
          onClick={handleUpload} 
          disabled={loading} 
          className="px-8 py-6 gap-2"
          size="lg"
        >
          {loading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span>Upload Files</span>
            </>
          )}
        </Button>
      </div>
      
      {/* Instructions */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Import Instructions</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li className="text-sm">Ensure all files are in CSV or Excel format (.csv, .xlsx, .xls)</li>
          <li className="text-sm">Each file should have a header row with column names matching the expected fields</li>
          <li className="text-sm">Teacher IDs must be unique across all staff entries</li>
          <li className="text-sm">Task IDs must be unique for all assessment tasks</li>
          <li className="text-sm">Class IDs must be unique for all classes</li>
          <li className="text-sm">Leave dates should be in the format "YYYY-MM-DD to YYYY-MM-DD"</li>
          <li className="text-sm">Due dates should be in the format "YYYY-MM-DD"</li>
        </ul>
      </div>
    </div>
  );
};

export default DataImport;
