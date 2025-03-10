// File structure for the React frontend

// src/App.js - Main application component
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DataImport from './pages/DataImport';
import MarkerAssignment from './pages/MarkerAssignment';
import StaffingChanges from './pages/StaffingChanges';
import GanttView from './pages/GanttView';
import TeacherReports from './pages/TeacherReports';
import TaskTracking from './pages/TaskTracking';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<DataImport />} />
            <Route path="/assignment" element={<MarkerAssignment />} />
            <Route path="/staffing" element={<StaffingChanges />} />
            <Route path="/gantt" element={<GanttView />} />
            <Route path="/reports" element={<TeacherReports />} />
            <Route path="/tracking" element={<TaskTracking />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

// src/components/Navbar.js - Navigation component
import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Marking Maestro</Link>
      </div>
      <ul className="navbar-menu">
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/import">Data Import</Link></li>
        <li><Link to="/assignment">Marker Assignment</Link></li>
        <li><Link to="/staffing">Staffing Changes</Link></li>
        <li><Link to="/gantt">Gantt Chart</Link></li>
        <li><Link to="/reports">Teacher Reports</Link></li>
        <li><Link to="/tracking">Task Tracking</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;

// src/pages/DataImport.js - File import interface
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

function DataImport() {
  const [staffFile, setStaffFile] = useState(null);
  const [tasksFile, setTasksFile] = useState(null);
  const [classesFile, setClassesFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStaffFileChange = (e) => {
    setStaffFile(e.target.files[0]);
  };

  const handleTasksFileChange = (e) => {
    setTasksFile(e.target.files[0]);
  };

  const handleClassesFileChange = (e) => {
    setClassesFile(e.target.files[0]);
  };

  const uploadFiles = async () => {
    if (!staffFile && !tasksFile && !classesFile) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    if (staffFile) formData.append('staff', staffFile);
    if (tasksFile) formData.append('tasks', tasksFile);
    if (classesFile) formData.append('classes', classesFile);

    try {
      const response = await axios.post('/api/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Files uploaded successfully!');
      // Handle the response data - perhaps update state or navigate to another page
    } catch (error) {
      toast.error(`Error uploading files: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-import-container">
      <h1>Data Import</h1>
      
      <div className="import-section">
        <h2>Staff Import</h2>
        <p>Upload CSV or Excel file with Teacher ID, Name, Email, Leave Dates, Class Allocations</p>
        <input 
          type="file" 
          accept=".csv, .xlsx, .xls" 
          onChange={handleStaffFileChange} 
        />
      </div>
      
      <div className="import-section">
        <h2>Assessment Task Import</h2>
        <p>Upload CSV or Excel file with Task ID, Task Name, Course, Year Group, Due Date, Number of Markers Required</p>
        <input 
          type="file" 
          accept=".csv, .xlsx, .xls" 
          onChange={handleTasksFileChange} 
        />
      </div>
      
      <div className="import-section">
        <h2>Class Import</h2>
        <p>Upload CSV or Excel file with Class ID, Class Name, Course, Year Group, Teacher ID, Student Count</p>
        <input 
          type="file" 
          accept=".csv, .xlsx, .xls" 
          onChange={handleClassesFileChange} 
        />
      </div>
      
      <button 
        className="import-button" 
        onClick={uploadFiles}
        disabled={loading}
      >
        {loading ? 'Uploading...' : 'Upload Files'}
      </button>
    </div>
  );
}

export default DataImport;
