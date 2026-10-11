import os
from flask import Flask
from app.models import db

def create_app():
    """Application factory pattern for Flask initialization."""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL', 
        'postgresql://username:password@your-neon-endpoint.neon.tech/dbname?sslmode=require'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    with app.app_context():
        from app.routes import main_bp
        app.register_blueprint(main_bp)
        db.create_all()

    return app