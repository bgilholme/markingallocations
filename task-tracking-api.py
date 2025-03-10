# app/routes/task_tracking.py
from flask import Blueprint, request, jsonify
from app.models import TaskTracking, Task, Teacher, Class
from app import db
from datetime import datetime, timedelta
from sqlalchemy import and_, or_

task_tracking_bp = Blueprint('task_tracking', __name__, url_prefix='/api/task-tracking')

@task_tracking_bp.route('/', methods=['GET'])
def get_tasks():
    """Get all task tracking entries with optional filtering"""
    # Get query parameters
    status = request.args.get('status')
    task_id = request.args.get('task_id')
    teacher_id = request.args.get('teacher_id')
    
    # Base query
    query = TaskTracking.query.join(Task).join(Teacher).join(Class)
    
    # Apply filters
    if status:
        query = query.filter(TaskTracking.status == status)
    if task_id:
        query = query.filter(TaskTracking.task_id == task_id)
    if teacher_id:
        query = query.filter(TaskTracking.teacher_id == teacher_id)
    
    # Execute query
    tasks = query.all()
    
    # Convert to dict
    result = []
    for task in tasks:
        result.append({
            'id': task.id,
            'task': {
                'id': task.task.id,
                'name': task.task.name,
                'course': task.task.course,
                'due_date': task.task.due_date.isoformat(),
            },
            'teacher': {
                'id': task.teacher.id,
                'name': task.teacher.name,
                'email': task.teacher.email
            },
            'assigned_class': {
                'id': task.assigned_class.id,
                'name': task.assigned_class.name,
                'student_count': task.assigned_class.student_count
            },
            'status': task.status,
            'completion_percentage': task.completion_percentage,
            'comments': task.comments,
            'estimated_completion_date': task.estimated_completion_date.isoformat() if task.estimated_completion_date else None,
            'last_updated': task.last_updated.isoformat(),
            'is_overdue': is_task_overdue(task)
        })
    
    return jsonify(result)

@task_tracking_bp.route('/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a specific task tracking entry"""
    task = TaskTracking.query.get_or_404(task_id)
    
    data = request.json
    
    if 'status' in data:
        task.status = data['status']
    if 'completion_percentage' in data:
        task.completion_percentage = data['completion_percentage']
    if 'comments' in data:
        task.comments = data['comments']
    if 'estimated_completion_date' in data and data['estimated_completion_date']:
        task.estimated_completion_date = datetime.fromisoformat(data['estimated_completion_date'].replace('Z', '+00:00'))
    
    # Update last_updated timestamp
    task.last_updated = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': 'Task updated successfully'})

@task_tracking_bp.route('/bulk-update', methods=['POST'])
def bulk_update_tasks():
    """Update multiple task tracking entries at once"""
    data = request.json
    task_ids = data.get('task_ids', [])
    
    if not task_ids:
        return jsonify({'error': 'No task IDs provided'}), 400
    
    tasks = TaskTracking.query.filter(TaskTracking.id.in_(task_ids)).all()
    
    for task in tasks:
        if 'status' in data:
            task.status = data['status']
        if 'completion_percentage' in data:
            task.completion_percentage = data['completion_percentage']
        if 'comments' in data:
            task.comments = data['comments']
        if 'estimated_completion_date' in data and data['estimated_completion_date']:
            task.estimated_completion_date = datetime.fromisoformat(data['estimated_completion_date'].replace('Z', '+00:00'))
        
        # Update last_updated timestamp
        task.last_updated = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': f'Updated {len(tasks)} tasks successfully'})

@task_tracking_bp.route('/summary/teacher/<int:teacher_id>', methods=['GET'])
def get_teacher_summary(teacher_id):
    """Get summary statistics for a specific teacher"""
    # Get all tasks for the teacher
    tasks = TaskTracking.query.filter_by(teacher_id=teacher_id).all()
    
    # Calculate summary statistics
    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.status == 'Completed')
    in_progress_tasks = sum(1 for task in tasks if task.status == 'In Progress')
    
    # Calculate overdue tasks
    overdue_tasks = sum(1 for task in tasks if is_task_overdue(task) and task.status != 'Completed')
    
    # Calculate completion rate
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    return jsonify({
        'teacher_id': teacher_id,
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'in_progress_tasks': in_progress_tasks,
        'overdue_tasks': overdue_tasks,
        'completion_rate': completion_rate
    })

@task_tracking_bp.route('/summary/task/<int:task_id>', methods=['GET'])
def get_task_summary(task_id):
    """Get summary statistics for a specific task"""
    # Get all tracking entries for the task
    tracking_entries = TaskTracking.query.filter_by(task_id=task_id).all()
    
    # Get task details
    task = Task.query.get_or_404(task_id)
    
    # Calculate summary statistics
    total_classes = len(tracking_entries)
    completed_classes = sum(1 for entry in tracking_entries if entry.status == 'Completed')
    
    # Calculate overall progress
    overall_progress = sum(entry.completion_percentage for entry in tracking_entries) / total_classes if total_classes > 0 else 0
    
    # Check if task is overdue
    marking_deadline = task.due_date + timedelta(days=14)
    is_overdue = datetime.utcnow() > marking_deadline and overall_progress < 100
    
    # Get total markers
    total_markers = len(set(entry.teacher_id for entry in tracking_entries))
    
    return jsonify({
        'task_id': task_id,
        'task_name': task.name,
        'total_classes': total_classes,
        'completed_classes': completed_classes,
        'overall_progress': overall_progress,
        'is_overdue': is_overdue,
        'due_date': task.due_date.isoformat(),
        'marking_deadline': marking_deadline.isoformat(),
        'total_markers': total_markers
    })

@task_tracking_bp.route('/gantt', methods=['GET'])
def get_gantt_data():
    """Get data for Gantt chart visualization"""
    # Get filter parameters
    teacher_id = request.args.get('teacher_id')
    course = request.args.get('course')
    year_group = request.args.get('year_group')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Base query
    query = TaskTracking.query.join(Task).join(Teacher).join(Class)
    
    # Apply filters
    if teacher_id:
        query = query.filter(TaskTracking.teacher_id == teacher_id)
    if course:
        query = query.filter(Task.course == course)
    if year_group:
        query = query.filter(Class.year_group == year_group)
    
    # Date range filter
    if start_date and end_date:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        
        # Task due dates or marking deadlines fall within the range
        query = query.filter(
            or_(
                and_(Task.due_date >= start, Task.due_date <= end),
                and_(Task.due_date + timedelta(days=14) >= start, Task.due_date + timedelta(days=14) <= end)
            )
        )
    
    # Execute query
    tasks = query.all()
    
    # Convert to dict for Gantt chart
    result = []
    for task in tasks:
        result.append({
            'task_id': task.task.id,
            'teacher_id': task.teacher.id,
            'class_id': task.assigned_class.id,
            'task': {
                'id': task.task.id,
                'name': task.task.name,
                'course': task.task.course,
                'due_date': task.task.due_date.isoformat(),
            },
            'teacher': {
                'id': task.teacher.id,
                'name': task.teacher.name,
            },
            'assigned_class': {
                'id': task.assigned_class.id,
                'name': task.assigned_class.name,
            },
            'status': task.status,
            'completion_percentage': task.completion_percentage,
            'is_overdue': is_task_overdue(task)
        })
    
    return jsonify(result)

def is_task_overdue(task):
    """Helper function to determine if a task is overdue"""
    marking_deadline = task.task.due_date + timedelta(days=14)
    return datetime.utcnow() > marking_deadline and task.status != 'Completed'
