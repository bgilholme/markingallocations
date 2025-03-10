// src/components/TaskTracking/TaskTrackingMain.jsx
import React, { useState } from 'react';
import { Tabs, message } from 'antd';
import { 
  BarChartOutlined, 
  DashboardOutlined, 
  SyncOutlined 
} from '@ant-design/icons';
import TaskTrackingDashboard from './TaskTrackingDashboard';
import TaskTrackingGantt from './TaskTrackingGantt';
import './GanttChart.css';

const { TabPane } = Tabs;

const TaskTrackingMain = () => {
  const [activeKey, setActiveKey] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    message.loading('Refreshing data...', 1, () => {
      setRefreshKey(prev => prev + 1);
      message.success('Data refreshed');
    });
  };

  return (
    <div className="task-tracking-container">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>Task Tracking</h1>
        <button 
          className="ant-btn ant-btn-primary" 
          onClick={handleRefresh}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <SyncOutlined style={{ marginRight: 8 }} />
          Refresh Data
        </button>
      </div>

      <Tabs 
        activeKey={activeKey} 
        onChange={setActiveKey}
        type="card"
        size="large"
        tabBarStyle={{ marginBottom: 24 }}
      >
        <TabPane
          tab={
            <span>
              <DashboardOutlined />
              Dashboard
            </span>
          }
          key="dashboard"
        >
          <TaskTrackingDashboard key={`dashboard-${refreshKey}`} />
        </TabPane>
        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              Gantt Chart
            </span>
          }
          key="gantt"
        >
          <TaskTrackingGantt key={`gantt-${refreshKey}`} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TaskTrackingMain;
