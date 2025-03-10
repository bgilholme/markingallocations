// src/pages/MarkerAssignment.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function MarkerAssignment() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState(null);
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all needed data
        const [tasksRes, classesRes, teachersRes, allocationsRes] = await Promise.all([
          axios.get('/api/tasks'),
          axios.get('/api/classes'),
          axios.get('/api/teachers'),
          axios.get('/api/allocations')
        ]);
        
        setTasks(tasksRes.data);
        setClasses(classesRes.data);
        setTeachers(teachersRes.data);
        setAllocations(allocationsRes.data);
        
        setLoading(false);
      } catch (err) {
        setError(`Error loading data: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Load assignments when a task is selected
  useEffect(() => {
    if (!selectedTask) {
      setAssignments([]);
      return;
    }
    
    // Find classes for this task's course
    const task = tasks.find(t => t.id === selectedTask);
    if (!task) return;
    
    const courseClasses = classes.filter(c => c.course === task.course);
    
    // Get existing allocations for this task
    const taskAllocations = allocations.filter(a => a.task_id === selectedTask);
    
    // Create assignment objects for all classes in this course
    const assignmentsList = courseClasses.map(cls => {
      // Find if there's an existing allocation for this class and task
      const existingAllocation = taskAllocations.find(a => a.class_id === cls.id);
      
      return {
        class: cls,
        teacher: existingAllocation 
          ? teachers.find(t => t.id === existingAllocation.teacher_id) 
          : null,
        allocationId: existingAllocation?.id || null
      };
    });
    
    setAssignments(assignmentsList);
  }, [selectedTask, tasks, classes, teachers, allocations]);
  
  const handleTaskChange = (e) => {
    setSelectedTask(e.target.value);
  };
  
  const handleTeacherChange = async (classId, teacherId) => {
    // Find the assignment for this class
    const assignment = assignments.find(a => a.class.id === classId);
    if (!assignment) return;
    
    try {
      if (assignment.allocationId) {
        // Update existing allocation
        await axios.put(`/api/allocations/${assignment.allocationId}`, {
          teacher_id: teacherId
        });
        
        // Update local state
        setAllocations(prev => prev.map(a => 
          a.id === assignment.allocationId 
            ? {...a, teacher_id: teacherId} 
            : a
        ));
      } else {
        // Create new allocation
        const task = tasks.find(t => t.id === selectedTask);
        
        // Calculate start and end dates
        const startDate = new Date(task.due_date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 14); // 2 week marking window
        
        const response = await axios.post('/api/allocations', {
          task_id: selectedTask,
          class_id: classId,
          teacher_id: teacherId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'Not Started'
        });
        
        // Update local state
        setAllocations(prev => [...prev, response.data]);
      }
      
      // Update assignments state
      setAssignments(prev => prev.map(a => {
        if (a.class.id === classId) {
          return {
            ...a,
            teacher: teachers.find(t => t.id === teacherId)
          };
        }
        return a;
      }));
      
      toast.success('Teacher assignment updated successfully');
    } catch (err) {
      toast.error(`Error updating assignment: ${err.message}`);
    }
  };
  
  const checkForWarnings = (classId, teacherId) => {
    if (!teacherId) return null;
    
    const assignment = assignments.find(a => a.class.id === classId);
    if (!assignment) return null;
    
    // Check if teacher is assigned to their own class
    const classTeacherId = assignment.class.teacher_id;
    if (classTeacherId === teacherId) {
      return "Warning: Teacher assigned to mark their own class";
    }
    
    // Check for teacher on leave
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return null;
    
    // If we have leave data, we could check for overlap with marking period
    // This is a simplified check - you'd need more sophisticated date parsing
    if (teacher.leave_dates && teacher.leave_dates.length > 0) {
      const task = tasks.find(t => t.id === selectedTask);
      if (task) {
        // This is a placeholder for actual leave date checking logic
        // You would need to parse the leave_dates field and check for overlap
        return "Warning: Teacher may be on leave during marking period";
      }
    }
    
    return null;
  };
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <div className="marker-assignment-container">
      <h1>Marker Assignment</h1>
      
      <div className="task-selector">
        <label>Select Assessment Task:</label>
        <select value={selectedTask} onChange={handleTaskChange}>
          <option value="">-- Select a Task --</option>
          {tasks.map(task => (
            <option key={task.id} value={task.id}>
              {task.name} - {task.course} ({task.year_group})
            </option>
          ))}
        </select>
      </div>
      
      {selectedTask && (
        <div className="assignment-section">
          <h2>Assign Markers</h2>
          
          {loading ? (
            <div className="loading">Loading assignments...</div>
          ) : (
            <table className="assignment-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Course</th>
                  <th>Year Group</th>
                  <th>Current Teacher</th>
                  <th>Assigned Marker</th>
                  <th>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(assignment => {
                  const warning = assignment.teacher 
                    ? checkForWarnings(assignment.class.id, assignment.teacher.id)
                    : null;
                  
                  return (
                    <tr key={assignment.class.id}>
                      <td>{assignment.class.name}</td>
                      <td>{assignment.class.course}</td>
                      <td>{assignment.class.year_group}</td>
                      <td>
                        {teachers.find(t => t.id === assignment.class.teacher_id)?.name || 'Unknown'}
                      </td>
                      <td>
                        <select
                          value={assignment.teacher?.id || ''}
                          onChange={(e) => handleTeacherChange(assignment.class.id, e.target.value)}
                        >
                          <option value="">-- Assign Teacher --</option>
                          {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={warning ? 'warning-text' : ''}>
                        {warning || ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {!selectedTask && (
        <div className="no-selection-message">
          Please select an assessment task to begin assigning markers.
        </div>
      )}
    </div>
  );
}

export default MarkerAssignment;
