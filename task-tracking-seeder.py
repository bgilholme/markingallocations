# scripts/seed_task_tracking.py
from app import db, create_app
from app.models import Teacher, Class, Task, TaskTracking
from datetime import datetime, timedelta
import random

def seed_data():
    """Seed the database with sample data for task tracking"""
    app = create_app()
    with app.app_context():
        # Clear existing data
        TaskTracking.query.delete()
        Task.query.delete()
        Class.query.delete()
        Teacher.query.delete()
        
        # Create teachers
        teachers = [
            Teacher(name='John Smith', email='john.smith@school.edu'),
            Teacher(name='Jane Doe', email='jane.doe@school.edu'),
            Teacher(name='Michael Johnson', email='michael.johnson@school.edu'),
            Teacher(name='Emily Williams', email='emily.williams@school.edu'),
            Teacher(name='David Brown', email='david.brown@school.edu'),
        ]
        
        db.session.add_all(teachers)
        db.session.commit()
        
        # Create courses and year groups
        courses = ['Mathematics', 'English', 'Science', 'History', 'Geography']
        year_groups = ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12']
        
        # Create classes
        classes = []
        for course in courses:
            for year_group in year_groups:
                # Assign 2 classes per course/year combination
                for i in range(2):
                    teacher = random.choice(teachers)
                    class_name = f"{year_group} {course} {i+1}"
                    student_count = random.randint(15, 30)
                    
                    new_class = Class(
                        name=class_name,
                        course=course,
                        year_group=year_group,
                        teacher_id=teacher.id,
                        student_count=student_count
                    )
                    
                    classes.append(new_class)
        
        db.session.add_all(classes)
        db.session.commit()
        
        # Create assessment tasks
        tasks = []
        current_date = datetime.now()
        
        for course in courses:
            for year_group in year_groups:
                # Create 3 tasks per course/year combination with staggered due dates
                for i in range(3):
                    due_date = current_date + timedelta(days=15*i - 30 + random.randint(-5, 5))
                    markers_required = random.randint(1, 3)
                    
                    task_name = f"{course} Assessment {i+1}"
                    
                    new_task = Task(
                        name=task_name,
                        course=course,
                        year_group=year_group,
                        due_date=due_date,
                        markers_required=markers_required
                    )
                    
                    tasks.append(new_task)
        
        db.session.add_all(tasks)
        db.session.commit()
        
        # Create task tracking entries
        task_trackings = []
        
        # For each task, assign markers to classes
        for task in tasks:
            # Get classes for this course and year group
            relevant_classes = [c for c in classes if c.course == task.course and c.year_group == task.year_group]
            
            # For each class, assign a teacher (not necessarily the class teacher)
            for class_item in relevant_classes:
                # Select a random teacher who doesn't teach this class
                available_teachers = [t for t in teachers if t.id != class_item.teacher_id]
                
                # If no other teachers available or random chance to have own teacher mark
                if not available_teachers or random.random() < 0.2:
                    assigned_teacher = class_item.teacher
                else:
                    assigned_teacher = random.choice(available_teachers)
                
                # Create task tracking entry
                status_options = ['Not Started', 'In Progress', 'Completed', 'Delayed', 'Needs Review']
                
                # Determine status probabilities based on due date
                if task.due_date > current_date + timedelta(days=7):
                    # Future task: mostly not started or in progress
                    status_weights = [0.7, 0.2, 0.05, 0.03, 0.02]
                elif task.due_date > current_date:
                    # Upcoming task: mix of not started and in progress
                    status_weights = [0.3, 0.5, 0.1, 0.05, 0.05]
                elif task.due_date > current_date - timedelta(days=14):
                    # Recent task: mostly in progress or completed
                    status_weights = [0.1, 0.4, 0.3, 0.1, 0.1]
                else:
                    # Past task: mostly completed
                    status_weights = [0.05, 0.15, 0.6, 0.1, 0.1]
                
                status = random.choices(status_options, weights=status_weights)[0]
                
                # Set completion percentage based on status
                if status == 'Not Started':
                    completion = 0.0
                elif status == 'In Progress':
                    completion = random.uniform(10.0, 90.0)
                elif status == 'Completed':
                    completion = 100.0
                elif status == 'Delayed':
                    completion = random.uniform(0.0, 50.0)
                else:  # Needs Review
                    completion = random.uniform(90.0, 99.0)
                
                # Set estimated completion date if applicable
                if status in ['In Progress', 'Delayed']:
                    est_completion = task.due_date + timedelta(days=random.randint(7, 21))
                else:
                    est_completion = None
                
                # Set last updated date
                if status == 'Not Started':
                    last_updated = task.due_date - timedelta(days=random.randint(14, 30))
                else:
                    days_since_update = random.randint(1, 10)
                    last_updated = current_date - timedelta(days=days_since_update)
                
                # Create comments based on status
                if status == 'Not Started':
                    comments = None
                elif status == 'In Progress':
                    comments = "Making progress. Will complete on schedule."
                elif status == 'Completed':
                    comments = "All marking completed and feedback provided."
                elif status == 'Delayed':
                    comments = "Delayed due to unforeseen circumstances. Will need additional time."
                else:  # Needs Review
                    comments = "Marking completed but need to review consistency of grades."
                
                tracking_entry = TaskTracking(
                    task_id=task.id,
                    teacher_id=assigned_teacher.id,
                    class_id=class_item.id,
                    status=status,
                    completion_percentage=completion,
                    comments=comments,
                    estimated_completion_date=est_completion,
                    last_updated=last_updated
                )
                
                task_trackings.append(tracking_entry)
        
        db.session.add_all(task_trackings)
        db.session.commit()
        
        print(f"Seeded {len(teachers)} teachers")
        print(f"Seeded {len(classes)} classes")
        print(f"Seeded {len(tasks)} tasks")
        print(f"Seeded {len(task_trackings)} task tracking entries")

if __name__ == '__main__':
    seed_data()
