# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

# Initialize SQLAlchemy with no settings
db = SQLAlchemy()

def create_app(test_config=None):
    """Create and configure the Flask application"""
    app = Flask(__name__, static_folder='../build', static_url_path='/')
    
    # Enable CORS
    CORS(app)
    
    # Configure the database
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 'sqlite:///marking_maestro.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    from app.routes.task_tracking import task_tracking_bp
    app.register_blueprint(task_tracking_bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app
