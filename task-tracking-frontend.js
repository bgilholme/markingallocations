// src/components/TaskTracking/TaskTrackingDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table, 
  Button, 
  Badge, 
  Progress, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Modal, 
  message, 
  Tabs, 
  Card, 
  Statistic, 
  Row, 
  Col,
  Tooltip
} from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  EditOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const TaskTrackingDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [form] = Form.useForm();
  const [teacherSummary, setTeacherSummary] = useState(null);
  const [taskSummaries, setTaskSummaries] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [filters, setFilters] = useState({
    status: '',
    taskId: '',
  });
  const [bulkEditModalVisible, setBulkEditModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkForm] = Form.useForm();

  // Get current user from context/state
  const currentUser = { id: 1, role: 'admin' }; // Replace with actual auth context

  useEffect(() => {
    fetchTasks();
    if (currentUser.role === 'teacher') {
      fetchTeacherSummary(currentUser.id);
    }
    fetchTaskSummaries();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = '/api/task-tracking/';
      const params = new URLSearchParams();
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      if (filters.taskId) {
        params.append('task_id', filters.taskId);
      }
      
      if (currentUser.role === 'teacher') {
        params.append('teacher_id', currentUser.id);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setTasks(response.data);
    } catch (error) {
      message.error('Failed to fetch tasks');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherSummary = async (teacherId) => {
    try {
      const response = await axios.get(`/api/task-tracking/summary/teacher/${teacherId}`);
      setTeacherSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch teacher summary', error);
    }
  };

  const fetchTaskSummaries = async () => {
    try {
      // This would normally fetch summaries for all tasks the user has access to
      // For demo purposes, we'll fetch a few specific task summaries
      const taskIds = [1, 2, 3]; // Replace with actual task IDs
      const summaries = await Promise.all(
        taskIds.map(id => axios.get(`/api/task-tracking/summary/task/${id}`))
      );
      setTaskSummaries(summaries.map(response => response.data));
    } catch (error) {
      console.error('Failed to fetch task summaries', error);
    }
  };

  const handleEdit = (task) => {
    setCurrentTask(task);
    form.setFieldsValue({
      status: task.status,
      completion_percentage: task.completion_percentage,
      comments: task.comments,
      estimated_completion_date: task.estimated_completion_date ? moment(task.estimated_completion_date) : null,
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async (values) => {
    try {
      await axios.put(`/api/task-tracking/${currentTask.id}`, {
        ...values,
        estimated_completion_date: values.estimated_completion_date ? values.estimated_completion_date.toISOString() : null,
      });
      message.success('Task updated successfully');
      setEditModalVisible(false);
      fetchTasks();
      if (currentUser.role === 'teacher') {
        fetchTeacherSummary(currentUser.id);
      }
    } catch (error) {
      message.error('Failed to update task');
      console.error(error);
    }
  };

  const handleBulkEdit = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select at least one task');
      return;
    }
    setBulkEditModalVisible(true);
  };

  const handleBulkUpdate = async (values) => {
    try {
      await axios.post('/api/task-tracking/bulk-update', {
        task_ids: selectedRowKeys,
        ...values,
        estimated_completion_date: values.estimated_completion_date ? values.estimated_completion_date.toISOString() : null,
      });
      message.success('Tasks updated successfully');
      setBulkEditModalVisible(false);
      setSelectedRowKeys([]);
      fetchTasks();
      if (currentUser.role === 'teacher') {
        fetchTeacherSummary(currentUser.id);
      }
    } catch (error) {
      message.error('Failed to update tasks');
      console.error(error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <Badge status="success" text="Completed" />;
      case 'In Progress':
        return <Badge status="processing" text="In Progress" />;
      case 'Not Started':
        return <Badge status="default" text="Not Started" />;
      case 'Delayed':
        return <Badge status="error" text="Delayed" />;
      case 'Needs Review':
        return <Badge status="warning" text="Needs Review" />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  const columns = [
    {
      title: 'Task',
      dataIndex: 'task',
      key: 'task',
      render: (_, record) => (
        <div>
          <div><strong>{record.task.name}</strong></div>
          <div>{record.task.course} - {record.assigned_class.name}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusBadge(status),
    },
    {
      title: 'Progress',
      dataIndex: 'completion_percentage',
      key: 'completion_percentage',
      render: (percentage) => (
        <Progress percent={percentage} size="small" />
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'task',
      key: 'due_date',
      render: (task) => (
        <div>
          <div>{moment(task.due_date).format('DD/MM/YYYY')}</div>
          <div className="text-xs text-gray-500">
            Marking deadline: {moment(task.due_date).add(14, 'days').format('DD/MM/YYYY')}
          </div>
        </div>
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'last_updated',
      key: 'last_updated',
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          size="small" 
          onClick={() => handleEdit(record)}
        >
          Update
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <div className="task-tracking-dashboard">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <FileTextOutlined />
              Tasks
            </span>
          } 
          key="1"
        >
          <div className="filters-section" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Select
                  placeholder="Filter by status"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={(value) => handleFilterChange('status', value)}
                >
                  <Option value="Completed">Completed</Option>
                  <Option value="In Progress">In Progress</Option>
                  <Option value="Not Started">Not Started</Option>
                  <Option value="Delayed">Delayed</Option>
                  <Option value="Needs Review">Needs Review</Option>
                </Select>
              </Col>
              <Col span={8}>
                <Input
                  placeholder="Filter by task ID"
                  onChange={(e) => handleFilterChange('taskId', e.target.value)}
                />
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  onClick={handleBulkEdit}
                  disabled={selectedRowKeys.length === 0}
                >
                  Bulk Update
                </Button>
              </Col>
            </Row>
          </div>

          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </TabPane>

        {currentUser.role === 'teacher' && (
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                My Summary
              </span>
            } 
            key="2"
          >
            {teacherSummary && (
              <div className="teacher-summary">
                <Card title="My Marking Summary" bordered={false}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="Total Tasks"
                        value={teacherSummary.total_tasks}
                        prefix={<TeamOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Completed"
                        value={teacherSummary.completed_tasks}
                        valueStyle={{ color: '#3f8600' }}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="In Progress"
                        value={teacherSummary.in_progress_tasks}
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Overdue"
                        value={teacherSummary.overdue_tasks}
                        valueStyle={{ color: '#cf1322' }}
                        prefix={<ExclamationCircleOutlined />}
                      />
                    </Col>
                  </Row>

                  <div style={{ marginTop: 24 }}>
                    <Statistic
                      title="Overall Completion Rate"
                      value={teacherSummary.completion_rate}
                      precision={2}
                      suffix="%"
                    />
                    <Progress
                      percent={teacherSummary.completion_rate}
                      status="active"
                    />
                  </div>
                </Card>
              </div>
            )}
          </TabPane>
        )}

        <TabPane 
          tab={
            <span>
              <BarChartOutlined />
              Task Progress
            </span>
          } 
          key="3"
        >
          <div className="task-summaries">
            <Row gutter={[16, 16]}>
              {taskSummaries.map(summary => (
                <Col span={8} key={summary.task_id}>
                  <Card
                    title={summary.task_name}
                    extra={summary.is_overdue ? <Badge status="error" text="Overdue" /> : null}
                    bordered={true}
                  >
                    <Statistic
                      title="Overall Progress"
                      value={summary.overall_progress}
                      precision={2}
                      suffix="%"
                    />
                    <Progress percent={summary.overall_progress} status={summary.is_overdue ? "exception" : "active"} />
                    
                    <div style={{ marginTop: 16 }}>
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic 
                            title="Classes" 
                            value={`${summary.completed_classes}/${summary.total_classes}`} 
                            valueStyle={{ fontSize: '16px' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic 
                            title="Markers" 
                            value={summary.total_markers} 
                            valueStyle={{ fontSize: '16px' }}
                          />
                        </Col>
                      </Row>
                    </div>
                    
                    <div style={{ marginTop: 16 }}>
                      <p>
                        <strong>Due Date:</strong> {moment(summary.due_date).format('DD/MM/YYYY')}
                      </p>
                      <p>
                        <strong>Marking Deadline:</strong> {moment(summary.marking_deadline).format('DD/MM/YYYY')}
                      </p>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </TabPane>
      </Tabs>

      {/* Edit Modal */}
      <Modal
        title="Update Task Status"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleUpdate} layout="vertical">
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select>
              <Option value="Not Started">Not Started</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Delayed">Delayed</Option>
              <Option value="Needs Review">Needs Review</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="completion_percentage"
            label="Completion Percentage"
            rules={[{ required: true, message: 'Please input completion percentage' }]}
          >
            <Input type="number" min={0} max={100} />
          </Form.Item>
          
          <Form.Item
            name="estimated_completion_date"
            label="Estimated Completion Date"
          >
            <DatePicker />
          </Form.Item>
          
          <Form.Item
            name="comments"
            label="Comments"
          >
            <TextArea rows={4} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal
        title="Bulk Update Tasks"
        visible={bulkEditModalVisible}
        onCancel={() => setBulkEditModalVisible(false)}
        footer={null}
      >
        <Form form={bulkForm} onFinish={handleBulkUpdate} layout="vertical">
          <Form.Item
            name="status"
            label="Status"
          >
            <Select allowClear placeholder="Update status for all selected tasks">
              <Option value="Not Started">Not Started</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Delayed">Delayed</Option>
              <Option value="Needs Review">Needs Review</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="completion_percentage"
            label="Completion Percentage"
          >
            <Input type="number" min={0} max={100} placeholder="Update completion percentage for all selected tasks" />
          </Form.Item>
          
          <Form.Item
            name="comments"
            label="Comments"
          >
            <TextArea rows={4} placeholder="Add comments to all selected tasks" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update {selectedRowKeys.length} tasks
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskTrackingDashboard;
