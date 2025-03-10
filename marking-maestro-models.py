# models.py - Database models for the Marking Maestro app

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Teacher(db.Model):
    __tablename__ = 'teachers'
    
    teacher_id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    leave_dates = db.Column(db.Text)  # Stored as comma-separated date ranges
    class_allocations = db.Column(db.Text)  # JSON or comma-separated class IDs
    
    def __repr__(self):
        return f'<Teacher {self.name}>'

class Task(db.Model):
    __tablename__ = 'tasks'
    
    task_id = db.Column(db.String(50), primary_key=True)
    task_name = db.Column(db.String(100), nullable=False)
    course = db.Column(db.String(100), nullable=False)
    year_group = db.Column(db.String(50), nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    markers_required = db.Column(db.Integer, default=1)
    status = db.Column(db.String(50), default='Not Started')  # Not Started, In Progress, Completed
    
    def __repr__(self):
        return f'<Task {self.task_name}>'

class Class(db.Model):
    __tablename__ = 'classes'
    
    class_id = db.Column(db.String(50), primary_key=True)
    class_name = db.Column(db.String(100), nullable=False)
    course = db.Column(db.String(100), nullable=False)
    year_group = db.Column(db.String(50), nullable=False)
    teacher_id = db.Column(db.String(50), db.ForeignKey('teachers.teacher_id'), nullable=False)
    student_count = db.Column(db.Integer, default=0)
    
    teacher = db.relationship('Teacher', backref=db.backref('classes', lazy=True))
    
    def __repr__(self):
        return f'<Class {self.class_name}>'

class Allocation(db.Model):
    __tablename__ = 'allocations'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.String(50), db.ForeignKey('tasks.task_id'), nullable=False)
    teacher_id = db.Column(db.String(50), db.ForeignKey('teachers.teacher_id'), nullable=False)
    class_id = db.Column(db.String(50), db.ForeignKey('classes.class_id'), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), default='Not Started')  # Not Started, In Progress, Completed
    
    task = db.relationship('Task', backref=db.backref('allocations', lazy=True))
    teacher = db.relationship('Teacher', backref=db.backref('allocations', lazy=True))
    class_obj = db.relationship('Class', backref=db.backref('allocations', lazy=True))
    
    def __repr__(self):
        return f'<Allocation {self.id}>'
