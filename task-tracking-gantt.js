// src/components/TaskTracking/TaskTrackingGantt.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, Row, Col, Select, Button, DatePicker, Spin, Alert, Tooltip, Radio } from 'antd';
import { InfoCircleOutlined, DownloadOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import 'gantt-chart-library/dist/frappe-gantt.css';
import Gantt from 'frappe-gantt-react';
import moment from 'moment';
import { exportComponentAsPNG } from 'react-component-export-image';

const { Option } = Select;
const { RangePicker } = DatePicker;

const TaskTrackingGantt = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    teacher: '',
    course: '',
    yearGroup: '',
    dateRange: [moment().subtract(30, 'days'), moment().add(60, 'days')],
  });
  const [viewMode, setViewMode] = useState('Month');
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [yearGroups, setYearGroups] = useState([]);
  const ganttRef = useRef();

  useEffect(() => {
    fetchTaskData();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchTaskData();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      // In a real implementation, these would come from API endpoints
      const teachersResponse = await axios.get('/api/teachers');
      setTeachers(teachersResponse.data);
      
      const coursesResponse = await axios.get('/api/courses');
      setCourses(coursesResponse.data);
      
      const yearGroupsResponse = await axios.get('/api/year-groups');
      setYearGroups(yearGroupsResponse.data);
    } catch (error) {
      console.error('Failed to fetch filter options', error);
    }
  };

  const fetchTaskData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.teacher) {
        params.append('teacher_id', filters.teacher);
      }
      
      if (filters.course) {
        params.append('course', filters.course);
      }
      
      if (filters.yearGroup) {
        params.append('year_group', filters.yearGroup);
      }
      
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.append('start_date', filters.dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', filters.dateRange[1].format('YYYY-MM-DD'));
      }
      
      const response = await axios.get(`/api/task-tracking/gantt?${params.toString()}`);
      
      // Transform data for Gantt chart
      const ganttTasks = response.data.map(item => ({
        id: `task-${item.task_id}-${item.teacher_id}-${item.class_id}`,
        name: `${item.task.name} (${item.assigned_class.name})`,
        start: moment(item.task.due_date).toDate(),
        end: moment(item.task.due_date).add(14, 'days').toDate(),
        progress: item.completion_percentage,
        dependencies: '',
        custom_class: getTaskClass(item.status, item.is_overdue),
        teacher: item.teacher.name,
        status: item.status
      }));
      
      setTasks(ganttTasks);
    } catch (error) {
      console.error('Failed to fetch task data', error);
      setError('Failed to load marking task data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getTaskClass = (status, isOverdue) => {
    if (isOverdue && status !== 'Completed') {
      return 'overdue-task';
    }
    
    switch (status) {
      case 'Completed':
        return 'completed-task';
      case 'In Progress':
        return 'in-progress-task';
      case 'Not Started':
        return 'not-started-task';
      case 'Delayed':
        return 'delayed-task';
      case 'Needs Review':
        return 'review-task';
      default:
        return '';
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      teacher: '',
      course: '',
      yearGroup: '',
      dateRange: [moment().subtract(30, 'days'), moment().add(60, 'days')],
    });
  };

  const handleTaskClick = (task) => {
    // In a real implementation, this could open a modal with task details
    // or navigate to the task details page
    console.log('Task clicked:', task);
  };

  const exportGanttChart = () => {
    exportComponentAsPNG(ganttRef, {
      fileName: `marking-schedule-${moment().format('YYYY-MM-DD')}`,
      html2CanvasOptions: { scale: 2 }
    });
  };

  return (
    <Card title="Marking Schedule Gantt Chart" className="gantt-card">
      <div className="gantt-filters" style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Select Teacher"
              style={{ width: '100%' }}
              allowClear
              value={filters.teacher}
              onChange={(value) => handleFilterChange('teacher', value)}
            >
              {teachers.map(teacher => (
                <Option key={teacher.id} value={teacher.id}>{teacher.name}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Select Course"
              style={{ width: '100%' }}
              allowClear
              value={filters.course}
              onChange={(value) => handleFilterChange('course', value)}
            >
              {courses.map(course => (
                <Option key={course.id} value={course.id}>{course.name}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Select Year Group"
              style={{ width: '100%' }}
              allowClear
              value={filters.yearGroup}
              onChange={(value) => handleFilterChange('yearGroup', value)}
            >
              {yearGroups.map(yearGroup => (
                <Option key={yearGroup.id} value={yearGroup.id}>{yearGroup.name}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={7}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </Col>
          
          <Col xs={24} sm={24} md={2}>
            <div className="action-buttons" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={resetFilters}
                style={{ marginRight: 8 }}
                title="Reset filters"
              />
              <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                onClick={exportGanttChart}
                title="Export as PNG"
              />
            </div>
          </Col>
        </Row>
      </div>
      
      <div className="view-mode-selector" style={{ marginBottom: 16 }}>
        <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
          <Radio.Button value="Day">Day</Radio.Button>
          <Radio.Button value="Week">Week</Radio.Button>
          <Radio.Button value="Month">Month</Radio.Button>
          <Radio.Button value="Quarter Day">Quarter Day</Radio.Button>
          <Radio.Button value="Half Day">Half Day</Radio.Button>
        </Radio.Group>
        
        <Tooltip title="Tasks are color-coded by status. Red indicates overdue tasks.">
          <InfoCircleOutlined style={{ marginLeft: 16 }} />
        </Tooltip>
      </div>
      
      <div className="gantt-legend" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div className="legend-item">
            <span className="color-box completed-task"></span>
            <span>Completed</span>
          </div>
          <div className="legend-item">
            <span className="color-box in-progress-task"></span>
            <span>In Progress</span>
          </div>
          <div className="legend-item">
            <span className="color-box not-started-task"></span>
            <span>Not Started</span>
          </div>
          <div className="legend-item">
            <span className="color-box delayed-task"></span>
            <span>Delayed</span>
          </div>
          <div className="legend-item">
            <span className="color-box review-task"></span>
            <span>Needs Review</span>
          </div>
          <div className="legend-item">
            <span className="color-box overdue-task"></span>
            <span>Overdue</span>
          </div>
        </div>
      </div>
      
      {error && (
        <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}
      
      <div ref={ganttRef} className="gantt-container">
        {loading ? (
          <div className="loading-container" style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Loading marking schedule...</div>
          </div>
        ) : tasks.length === 0 ? (
          <Alert 
            message="No tasks found" 
            description="Try adjusting your filters to see more tasks."
            type="info" 
            showIcon 
          />
        ) : (
          <Gantt
            tasks={tasks}
            viewMode={viewMode}
            onClick={handleTaskClick}
            onDateChange={(task, start, end) => {
              console.log(`Task ${task.name} date changed: ${start} to ${end}`);
              // In a real implementation, you would update the task in the backend
            }}
            onProgressChange={(task, progress) => {
              console.log(`Task ${task.name} progress changed: ${progress}%`);
              // In a real implementation, you would update the task progress in the backend
            }}
            onViewChange={(mode) => setViewMode(mode)}
          />
        )}
      </div>
      
      <style jsx>{`
        .gantt-container {
          height: 500px;
          overflow-y: auto;
        }
        
        .color-box {
          display: inline-block;
          width: 16px;
          height: 16px;
          margin-right: 8px;
          border-radius: 3px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
        }
        
        .completed-task {
          background-color: #52c41a;
        }
        
        .in-progress-task {
          background-color: #1890ff;
        }
        
        .not-started-task {
          background-color: #d9d9d9;
        }
        
        .delayed-task {
          background-color: #faad14;
        }
        
        .review-task {
          background-color: #722ed1;
        }
        
        .overdue-task {
          background-color: #f5222d;
        }
      `}</style>
    </Card>
  );
};

export default TaskTrackingGantt;

// CSS to add to your global stylesheet or component
/*
.overdue-task .bar {
  fill: #f5222d !important;
}

.completed-task .bar {
  fill: #52c41a !important;
}

.in-progress-task .bar {
  fill: #1890ff !important;
}

.not-started-task .bar {
  fill: #d9d9d9 !important;
}

.delayed-task .bar {
  fill: #faad14 !important;
}

.review-task .bar {
  fill: #722ed1 !important;
}
*/
