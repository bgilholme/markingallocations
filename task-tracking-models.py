# app/models.py
from app import db
from datetime import datetime

class Teacher(db.Model):
    __tablename__ = 'teachers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    
    # Relationships
    classes = db.relationship('Class', backref='teacher', lazy=True)
    task_trackings = db.relationship('TaskTracking', backref='teacher', lazy=True)
    
    def __repr__(self):
        return f'<Teacher {self.name}>'

class Class(db.Model):
    __tablename__ = 'classes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    course = db.Column(db.String(100), nullable=False)
    year_group = db.Column(db.String(20), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=False)
    student_count = db.Column(db.Integer, nullable=False, default=0)
    
    # Relationships
    task_trackings = db.relationship('TaskTracking', backref='assigned_class', lazy=True)
    
    def __repr__(self):
        return f'<Class {self.name} ({self.course})>'

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    course = db.Column(db.String(100), nullable=False)
    year_group = db.Column(db.String(20), nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    markers_required = db.Column(db.Integer, nullable=False, default=1)
    
    # Relationships
    task_trackings = db.relationship('TaskTracking', backref='task', lazy=True)
    
    def __repr__(self):
        return f'<Task {self.name} due {self.due_date}>'

class TaskTracking(db.Model):
    __tablename__ = 'task_trackings'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    
    # Task status tracking
    status = db.Column(db.String(50), nullable=False, default='Not Started')
    completion_percentage = db.Column(db.Float, nullable=False, default=0.0)
    comments = db.Column(db.Text, nullable=True)
    estimated_completion_date = db.Column(db.DateTime, nullable=True)
    last_updated = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<TaskTracking Task:{self.task_id} Teacher:{self.teacher_id}>'
    
    @property
    def is_overdue(self):
        """Check if the task is overdue"""
        marking_deadline = self.task.due_date + datetime.timedelta(days=14)
        return datetime.utcnow() > marking_deadline and self.status != 'Completed'
