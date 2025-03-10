# app.py - Main Flask application

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import json
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename
from models import db, Teacher, Task, Class, Allocation

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///marking_maestro.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
db.init_app(app)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.before_first_request
def create_tables():
    db.create_all()

@app.route('/api/import', methods=['POST'])
def import_data():
    if 'staff' not in request.files and 'tasks' not in request.files and 'classes' not in request.files:
        return jsonify({"message": "No files provided"}), 400
    
    try:
        # Process staff data
        if 'staff' in request.files:
            staff_file = request.files['staff']
            if staff_file.filename:
                filename = secure_filename(staff_file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                staff_file.save(filepath)
                process_staff_file(filepath)
        
        # Process tasks data
        if 'tasks' in request.files:
            tasks_file = request.files['tasks']
            if tasks_file.filename:
                filename = secure_filename(tasks_file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                tasks_file.save(filepath)
                process_tasks_file(filepath)
        
        # Process classes data
        if 'classes' in request.files:
            classes_file = request.files['classes']
            if classes_file.filename:
                filename = secure_filename(classes_file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                classes_file.save(filepath)
                process_classes_file(filepath)
        
        return jsonify({"message": "Data imported successfully"}), 200
    
    except Exception as e:
        return jsonify({"message": f"Error processing files: {str(e)}"}), 500

def process_staff_file(filepath):
    # Determine file extension
    if filepath.endswith('.csv'):
        df = pd.read_csv(filepath)
    else:  # Assume Excel
        df = pd.read_excel(filepath)
    
    # Clear existing data
    Teacher.query.delete()
    
    # Process each row
    for _, row in df.iterrows():
        teacher = Teacher(
            teacher_id=row['Teacher ID'],
            name=row['Name'],
            email=row['Email'],
            leave_dates=row.get('Leave Dates', ''),  # Handle possible missing column
            class_allocations=row.get('Class Allocations', '')  # Handle possible missing column
        )
        db.session.add(teacher)
    
    db.session.commit()

def process_tasks_file(filepath):
    # Determine file extension
    if filepath.endswith('.csv'):
        df = pd.read_csv(filepath)
    else:  # Assume Excel
        df = pd.read_excel(filepath)
    
    # Clear existing data
    Task.query.delete()
    
    # Process each row
    for _, row in df.iterrows():
        # Convert due date to datetime if it's not already
        due_date = row['Due Date']
        if not isinstance(due_date, datetime):
            due_date = pd.to_datetime(due_date)
        
        task = Task(
            task_id=row['Task ID'],
            task_name=row['Task Name'],
            course=row['Course'],
            year_group=row['Year Group'],
            due_date=due_date,
            markers_required=int(row['Number of Markers Required']),
            status='Not Started'
        )
        db.session.add(task)
    
    db.session.commit()

def process_classes_file(filepath):
    # Determine file extension
    if filepath.endswith('.csv'):
        df = pd.read_csv(filepath)
    else:  # Assume Excel
        df = pd.read_excel(filepath)
    
    # Clear existing data
    Class.query.delete()
    
    # Process each row
    for _, row in df.iterrows():
        class_obj = Class(
            class_id=row['Class ID'],
            class_name=row['Class Name'],
            course=row['Course'],
            year_group=row['Year Group'],
            teacher_id=row['Teacher ID'],
            student_count=int(row['Student Count'])
        )
        db.session.add(class_obj)
    
    db.session.commit()

@app.route('/api/allocate', methods=['POST'])
def allocate_tasks():
    try:
        # Clear existing allocations
        Allocation.query.delete()
        
        # Get all teachers, tasks, and classes
        teachers = Teacher.query.all()
        tasks = Task.query.all()
        classes = Class.query.all()
        
        # Create a dictionary of teachers by ID for easy lookup
        teachers_dict = {teacher.teacher_id: teacher for teacher in teachers}
        
        # Create a dictionary of classes by course for easy grouping
        classes_by_course = {}
        for class_obj in classes:
            if class_obj.course not in classes_by_course:
                classes_by_course[class_obj.course] = []
            classes_by_course[class_obj.course].append(class_obj)
        
        allocations = []
        
        # Process each task
        for task in tasks:
            # Find classes for this task's course
            course_classes = classes_by_course.get(task.course, [])
            
            # Skip if no classes for this course
            if not course_classes:
                continue
            
            # Find potential markers (teachers) for this task
            potential_markers = []
            for class_obj in course_classes:
                teacher = teachers_dict.get(class_obj.teacher_id)
                if teacher:
                    # Check if teacher is on leave during the marking period
                    is_on_leave = check_leave_overlap(teacher, task)
                    
                    if not is_on_leave:
                        # Add to potential markers with information about whether they teach this course
                        potential_markers.append({
                            'teacher': teacher,
                            'teaches_course': True,
                            'teaches_classes': [c for c in course_classes if c.teacher_id == teacher.teacher_id]
                        })
            
            # Sort potential markers by marking load (fewer assignments first)
            potential_markers.sort(key=lambda x: len(x['teaches_classes']))
            
            # Allocate markers
            allocated_markers = []
            
            # First handle single-class courses
            if len(course_classes) == 1:
                # If only one class, assign the teacher of that class
                class_obj = course_classes[0]
                teacher = teachers_dict.get(class_obj.teacher_id)
                if teacher:
                    allocated_markers.append({
                        'teacher': teacher,
                        'class': class_obj
                    })
            else:
                # Multiple classes - implement rule to not mark own class
                # For each class, find a suitable marker
                for class_obj in course_classes:
                    # Try to find a teacher who doesn't teach this class
                    for marker in potential_markers:
                        teacher = marker['teacher']
                        if class_obj not in marker['teaches_classes'] and teacher not in [am['teacher'] for am in allocated_markers]:
                            allocated_markers.append({
                                'teacher': teacher,
                                'class': class_obj
                            })
                            break
            
            # If we still need more markers, add them
            while len(allocated_markers) < task.markers_required and potential_markers:
                # Find teachers not already allocated
                available_markers = [m for m in potential_markers if m['teacher'] not in [am['teacher'] for am in allocated_markers]]
                
                if not available_markers:
                    break
                
                # Take the teacher with the lowest load
                marker = available_markers[0]
                
                # Find a class they don't teach if possible
                for class_obj in course_classes:
                    if class_obj not in marker['teaches_classes']:
                        allocated_markers.append({
                            'teacher': marker['teacher'],
                            'class': class_obj
                        })
                        break
                else:
                    # If all classes are taught by this teacher, assign them to their own class
                    # (this is a fallback, ideally we'd avoid this)
                    allocated_markers.append({
                        'teacher': marker['teacher'],
                        'class': marker['teaches_classes'][0]
                    })
            
            # Create allocation records
            for allocation in allocated_markers:
                teacher = allocation['teacher']
                class_obj = allocation['class']
                
                # Calculate deadline (2 weeks after due date)
                deadline = task.due_date + timedelta(days=14)
                
                alloc = Allocation(
                    task_id=task.task_id,
                    teacher_id=teacher.teacher_id,
                    class_id=class_obj.class_id,
                    start_date=task.due_date,
                    end_date=deadline,
                    status='Not Started'
                )
                allocations.append(alloc)
                db.session.add(alloc)
        
        db.session.commit()
        
        return jsonify({
            "message": "Tasks allocated successfully",
            "allocations_count": len(allocations)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error allocating tasks: {str(e)}"}), 500

def check_leave_overlap(teacher, task):
    """
    Check if a teacher is on leave during the marking period for a task
    """
    if not teacher.leave_dates:
        return False
    
    # Parse leave dates (assuming format like "2023-01-01 to 2023-01-15, 2023-02-10 to 2023-02-20")
    leave_periods = []
    
    for period in teacher.leave_dates.split(','):
        period = period.strip()
        if 'to' in period:
            start_date_str, end_date_str = period.split('to')
            try:
                start_date = pd.to_datetime(start_date_str.strip())
                end_date = pd.to_datetime(end_date_str.strip())
                leave_periods.append((start_date, end_date))
            except:
                # Skip malformed date ranges
                continue
    
    # Define marking period (due date to due date + 2 weeks)
    marking_start = task.due_date
    marking_end = task.due_date + timedelta(days=14)
    
    # Check for overlap with any leave period
    for leave_start, leave_end in leave_periods:
        # Check if there's an overlap
        if (leave_start <= marking_end) and (leave_end >= marking_start):
            return True
    
    return False

@app.route('/api/teachers', methods=['GET'])
def get_teachers():
    teachers = Teacher.query.all()
    return jsonify([{
        'id': t.teacher_id,
        'name': t.name,
        'email': t.email,
        'leave_dates': t.leave_dates
    } for t in teachers]), 200

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([{
        'id': t.task_id,
        'name': t.task_name,
        'course': t.course,
        'year_group': t.year_group,
        'due_date': t.due_date.isoformat(),
        'markers_required': t.markers_required,
        'status': t.status
    } for t in tasks]), 200

@app.route('/api/classes', methods=['GET'])
def get_classes():
    classes = Class.query.all()
    return jsonify([{
        'id': c.class_id,
        'name': c.class_name,
        'course': c.course,
        'year_group': c.year_group,
        'teacher_id': c.teacher_id,
        'student_count': c.student_count
    } for c in classes]), 200

@app.route('/api/allocations', methods=['GET'])
def get_allocations():
    allocations = Allocation.query.all()
    return jsonify([{
        'id': a.id,
        'task_id': a.task_id,
        'teacher_id': a.teacher_id,
        'class_id': a.class_id,
        'start_date': a.start_date.isoformat(),
        'end_date': a.end_date.isoformat(),
        'status': a.status
    } for a in allocations]), 200

@app.route('/api/allocations/<int:allocation_id>', methods=['PUT'])
def update_allocation(allocation_id):
    data = request.json
    
    allocation = Allocation.query.get(allocation_id)
    if not allocation:
        return jsonify({"message": "Allocation not found"}), 404
    
    if 'teacher_id' in data:
        allocation.teacher_id = data['teacher_id']
    
    if 'status' in data:
        allocation.status = data['status']
    
    if 'start_date' in data:
        allocation.start_date = pd.to_datetime(data['start_date'])
    
    if 'end_date' in data:
        allocation.end_date = pd.to_datetime(data['end_date'])
    
    db.session.commit()
    
    return jsonify({"message": "Allocation updated successfully"}), 200

@app.route('/api/reports/teacher/<teacher_id>', methods=['GET'])
def teacher_report(teacher_id):
    # Get all allocations for this teacher
    allocations = Allocation.query.filter_by(teacher_id=teacher_id).all()
    
    report_data = []
    
    for allocation in allocations:
        # Get associated task and class
        task = Task.query.get(allocation.task_id)
        class_obj = Class.query.get(allocation.class_id)
        
        if task and class_obj:
            report_data.append({
                'task_name': task.task_name,
                'course': task.course,
                'year_group': task.year_group,
                'class_name': class_obj.class_name,
                'student_count': class_obj.student_count,
                'due_date': task.due_date.isoformat(),
                'marking_deadline': allocation.end_date.isoformat(),
                'status': allocation.status
            })
    
    return jsonify(report_data), 200

if __name__ == '__main__':
    app.run(debug=True)
