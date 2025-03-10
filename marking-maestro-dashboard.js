// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Chart } from 'chart.js/auto';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalTasks: 0,
    totalClasses: 0,
    totalAllocations: 0,
    tasksByStatus: { notStarted: 0, inProgress: 0, completed: 0 },
    upcomingTasks: [],
    markingLoad: []
  });
  const [error, setError] = useState(null);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all required data
        const [teachersRes, tasksRes, classesRes, allocationsRes] = await Promise.all([
          axios.get('/api/teachers'),
          axios.get('/api/tasks'),
          axios.get('/api/classes'),
          axios.get('/api/allocations')
        ]);
        
        // Calculate stats
        const teachers = teachersRes.data;
        const tasks = tasksRes.data;
        const classes = classesRes.data;
        const allocations = allocationsRes.data;
        
        // Count tasks by status
        const tasksByStatus = {
          notStarted: tasks.filter(t => t.status === 'Not Started').length,
          inProgress: tasks.filter(t => t.status === 'In Progress').length,
          completed: tasks.filter(t => t.status === 'Completed').length
        };
        
        // Get upcoming tasks (due in the next 14 days)
        const today = new Date();
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(today.getDate() + 14);
        
        const upcomingTasks = tasks
          .filter(task => {
            const dueDate = new Date(task.due_date);
            return dueDate >= today && dueDate <= twoWeeksLater;
          })
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 5); // Get top 5
        
        // Calculate marking load per teacher
        const teacherLoads = {};
        
        allocations.forEach(allocation => {
          const teacherId = allocation.teacher_id;
          if (!teacherLoads[teacherId]) {
            teacherLoads[teacherId] = {
              teacherId,
              teacherName: teachers.find(t => t.id === teacherId)?.name || 'Unknown',
              taskCount: 0,
              studentCount: 0
            };
          }
          
          teacherLoads[teacherId].taskCount++;
          
          // Add student count if we can find the class
          const classObj = classes.find(c => c.id === allocation.class_id);
          if (classObj) {
            teacherLoads[teacherId].studentCount += classObj.student_count;
          }
        });
        
        // Convert to array and sort by student count
        const markingLoad = Object.values(teacherLoads)
          .sort((a, b) => b.studentCount - a.studentCount)
          .slice(0, 10); // Top 10 teachers by load
        
        setStats({
          totalTeachers: teachers.length,
          totalTasks: tasks.length,
          totalClasses: classes.length,
          totalAllocations: allocations.length,
          tasksByStatus,
          upcomingTasks,
          markingLoad
        });
        
        setLoading(false);
      } catch (err) {
        setError(`Error loading dashboard data: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Create charts after data is loaded
  useEffect(() => {
    if (loading) return;
    
    // Task status chart
    const statusCtx = document.getElementById('taskStatusChart');
    if (statusCtx) {
      // Destroy existing chart if it exists
      const existingChart = Chart.getChart(statusCtx);
      if (existingChart) {
        existingChart.destroy();
      }
      
      new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['Not Started', 'In Progress', 'Completed'],
          datasets: [{
            data: [
              stats.tasksByStatus.notStarted,
              stats.tasksByStatus.inProgress,
              stats.tasksByStatus.completed
            ],
            backgroundColor: ['#ff6