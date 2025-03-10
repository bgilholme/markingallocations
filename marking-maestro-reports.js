// src/pages/TeacherReports.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';

function TeacherReports() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [reportData, setReportData] = useState([]);
  const [error, setError] = useState(null);
  
  // Fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/teachers');
        setTeachers(response.data);
        setLoading(false);
      } catch (err) {
        setError(`Error loading teachers: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchTeachers();
  }, []);
  
  // Fetch report data when a teacher is selected
  useEffect(() => {
    if (!selectedTeacher) {
      setReportData([]);
      return;
    }
    
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/reports/teacher/${selectedTeacher}`);
        setReportData(response.data);
        setLoading(false);
      } catch (err) {
        setError(`Error loading report: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [selectedTeacher]);
  
  const handleTeacherChange = (e) => {
    setSelectedTeacher(e.target.value);
  };
  
  const generateCSV = () => {
    if (!reportData.length) return;
    
    // Create CSV header
    const headers = [
      'Task Name',
      'Course',
      'Year Group',
      'Class Name',
      'Student Count',
      'Due Date',
      'Marking Deadline',
      'Status'
    ].join(',');
    
    // Create CSV rows
    const rows = reportData.map(item => [
      `"${item.task_name}"`,
      `"${item.course}"`,
      `"${item.year_group}"`,
      `"${item.class_name}"`,
      item.student_count,
      new Date(item.due_date).toLocaleDateString(),
      new Date(item.marking_deadline).toLocaleDateString(),
      `"${item.status}"`
    ].join(','));
    
    // Combine header and rows
    const csvContent = [headers, ...rows].join('\n');
    
    // Create a Blob and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const teacher = teachers.find(t => t.id === selectedTeacher);
    const filename = `${teacher?.name.replace(/\s+/g, '_')}_marking_report.csv` || 'marking_report.csv';
    
    saveAs(blob, filename);
    toast.success('Report downloaded successfully');
  };
  
  const sendEmailReport = async () => {
    if (!selectedTeacher || !reportData.length) return;
    
    try {
      const teacher = teachers.find(t => t.id === selectedTeacher);
      
      // This would normally call an API endpoint to send the email
      toast.info(`Email would be sent to ${teacher?.email} with their marking report`);
      
      // Mock implementation - in a real app you'd call an API
      /*
      await axios.post('/api/reports/email', {
        teacherId: selectedTeacher,
        email: teacher?.email,
        subject: 'Your Marking Allocation Report',
        includeAttachment: true
      });
      toast.success('Report emailed successfully');
      */
    } catch (err) {
      toast.error(`Error sending email: ${err.message}`);
    }
  };
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <div className="teacher-reports-container">
      <h1>Teacher Marking Reports</h1>
      
      <div className="teacher-selector">
        <label>Select Teacher:</label>
        <select value={selectedTeacher} onChange={handleTeacherChange}>
          <option value="">-- Select a Teacher --</option>
          {teachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
      </div>
      
      {selectedTeacher && (
        <div className="report-actions">
          <button 
            className="download-csv-button" 
            onClick={generateCSV}
            disabled={!reportData.length}
          >
            Download CSV Report
          </button>
          <button 
            className="email-report-button" 
            onClick={sendEmailReport}
            disabled={!reportData.length}
          >
            Email Report to Teacher
          </button>
        </div>
      )}
      
      {selectedTeacher && (
        <div className="report-section">
          <h2>Marking Allocation Report</h2>
          {loading ? (
            <div className="loading">Loading report data...</div>
          ) : reportData.length > 0 ? (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Course</th>
                  <th>Year Group</th>
                  <th>Class</th>
                  <th>Students</th>
                  <th>Due Date</th>
                  <th>Marking Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.task_name}</td>
                    <td>{item.course}</td>
                    <td>{item.year_group}</td>
                    <td>{item.class_name}</td>
                    <td>{item.student_count}</td>
                    <td>{new Date(item.due_date).toLocaleDateString()}</td>
                    <td>{new Date(item.marking_deadline).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data-message">
              No marking assignments found for this teacher.
            </div>
          )}
        </div>
      )}
      
      {!selectedTeacher && (
        <div className="no-selection-message">
          Please select a teacher to view their marking report.
        </div>
      )}
    </div>
  );
}

export default TeacherReports;
