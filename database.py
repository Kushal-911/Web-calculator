from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Calculation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    expression = db.Column(db.String(500), nullable=False)
    result = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50))  # standard, scientific, conversion
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)