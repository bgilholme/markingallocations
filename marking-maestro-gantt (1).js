// src/pages/GanttView.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

function GanttView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    teacher: 'all',
    course: 'all',
    yearGroup: 'all'
  });
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [yearGroups, setYearGroups] = useState([]);
  
  const ganttContainer = useRef(null);
  
  // Initialize Gantt chart
  useEffect(() => {
    gantt.config.date_format = "%Y-%m-%d %H:%i";
    gantt.config.scale_unit = "day";
    gantt.config.duration_unit = "day";
    gantt.config.start_date = new Date();
    gantt.config.end_date = new Date(new Date().setMonth(new Date().getMonth() + 2));
    
    // Color coding for task status
    gantt.templates.task_class = function(start, end, task) {
      switch (task.status) {
        case 'Completed':
          return 'task-completed';
        case 'In Progress':
          return 'task-in-progress';
        default:
          return 'task-not-started';
      }
    };
    
    gantt.init(ganttContainer.current);
    
    return () => {
      gantt.clearAll();
    };
  }, []);
  
  // Load data for filters and Gantt chart
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch teachers, tasks, classes, and allocations
        const [teachersRes, allocationsRes, tasksRes, classesRes] = await Promise.all([
          axios.get('/api/teachers'),
          axios.get('/api/allocations'),
          axios.get('/api/tasks'),
          axios.get('/api/classes')
        ]);
        
        // Process teachers for filter
        setTeachers(teachersRes.data);
        
        // Extract unique courses and year groups for filters
        const uniqueCourses = [...new Set(classesRes.data.map(c => c.course))];
        const uniqueYearGroups = [...new Set(classesRes.data.map(c => c.year_group))];
        
        setCourses(uniqueCourses);
        setYearGroups(uniqueYearGroups);
        
        // Create a lookup for tasks and classes
        const tasksMap = tasksRes.data.reduce((map, task) => {
          map[task.id] = task;
          return map;
        }, {});
        
        const classesMap = classesRes.data.reduce((map, cls) => {
          map[cls.id] = cls;
          return map;
        }, {});
        
        const teachersMap = teachersRes.data.reduce((map, teacher) => {
          map[teacher.id] = teacher;
          return map;
        }, {});
        
        // Format data for Gantt chart
        const ganttData = {
          data: allocationsRes.data.map(allocation => {
            const task = tasksMap[allocation.task_id];
            const cls = classesMap[allocation.class_id];
            const teacher = teachersMap[allocation.teacher_id];
            
            return {
              id: allocation.id,
              text: `${task?.name || 'Unknown Task'} - ${cls?.name || 'Unknown Class'}`,
              start_date: new Date(allocation.start_date),
              end_date: new Date(allocation.end_date),
              teacher_id: teacher?.id,
              teacher_name: teacher?.name,
              course: cls?.course,
              year_group: cls?.year_group,
              status: allocation.status,
              progress: allocation.status === 'Completed' ? 1 : 
                        allocation.status === 'In Progress' ? 0.5 : 0,
              open: true
            };
          })
        };
        
        // Load data into Gantt
        gantt.parse(ganttData);
        
        setLoading(false);
      } catch (err) {
        setError(`Error loading data: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters when they change
  useEffect(() => {
    gantt.clearAll();
    
    const fetchFilteredData = async () => {
      try {
        const response = await axios.get('/api/allocations');
        const allocations = response.data;
        
        // Get related data for display
        const [tasksRes, classesRes, teachersRes] = await Promise.all([
          axios.get('/api/tasks'),
          axios.get('/api/classes'),
          axios.get('/api/teachers')
        ]);
        
        const tasksMap = tasksRes.data.reduce((map, task) => {
          map[task.id] = task;
          return map;
        }, {});
        
        const classesMap = classesRes.data.reduce((map, cls) => {
          map[cls.id] = cls;
          return map;
        }, {});
        
        const teachersMap = teachersRes.data.reduce((map, teacher) => {
          map[teacher.id] = teacher;
          return map;
        }, {});
        
        // Filter allocations based on selected filters
        const filteredAllocations = allocations.filter(allocation => {
          const cls = classesMap[allocation.class_id];
          const teacher = teachersMap[allocation.teacher_id];
          
          return (
            (filters.teacher === 'all' || teacher?.id === filters.teacher) &&
            (filters.course === 'all' || cls?.course === filters.course) &&
            (filters.yearGroup === 'all' || cls?.year_group === filters.yearGroup)
          );
        });
        
        // Format filtered data for Gantt
        const ganttData = {
          data: filteredAllocations.map(allocation => {
            const task = tasksMap[allocation.task_id];
            const cls = classesMap[allocation.class_id];
            const teacher = teachersMap[allocation.teacher_id];
            
            return {
              id: allocation.id,
              text: `${task?.name || 'Unknown Task'} - ${cls?.name || 'Unknown Class'}`,
              start_date: new Date(allocation.start_date),
              end_date: new Date(allocation.end_date),
              teacher_id: teacher?.id,
              teacher_name: teacher?.name,
              course: cls?.course,
              year_group: cls?.year_group,
              status: allocation.status,
              progress: allocation.status === 'Completed' ? 1 : 
                        allocation.status === 'In Progress' ? 0.5 : 0,
              open: true
            };
          })
        };
        
        // Load filtered data into Gantt
        gantt.parse(ganttData);
      } catch (err) {
        setError(`Error applying filters: ${err.message}`);
      }
    };
    
    fetchFilteredData();
  }, [filters]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <div className="gantt-view-container">
      <h1>Marking Allocation Gantt Chart</h1>
      
      <div className="filter-controls">
        <div className="filter-group">
          <label>Teacher:</label>
          <select 
            name="teacher" 
            value={filters.teacher} 
            onChange={handleFilterChange}
          >
            <option value="all">All Teachers</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Course:</label>
          <select 
            name="course" 
            value={filters.course} 
            onChange={handleFilterChange}
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Year Group:</label>
          <select 
            name="yearGroup" 
            value={filters.yearGroup} 
            onChange={handleFilterChange}
          >
            <option value="all">All Year Groups</option>
            {yearGroups.map(yearGroup => (
              <option key={yearGroup} value={yearGroup}>{yearGroup}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="gantt-legend">
        <div className="legend-item">
          <div className="legend-color task-not-started"></div>
          <span>Not Started</span>
        </div>
        <div className="legend-item">
          <div className="legend-color task-in-progress"></div>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-color task-completed"></div>
          <span>Completed</span>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading Gantt chart...</div>
      ) : (
        <div 
          ref={ganttContainer} 
          className="gantt-chart" 
          style={{ height: '600px', width: '100%' }}
        ></div>
      )}
    </div>
  );
}

export default GanttView;
