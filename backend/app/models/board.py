from .base import BaseModel
from .. import db

class Board(BaseModel):
    """PCB Board model."""
    __tablename__ = 'boards'

    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    width = db.Column(db.Float, nullable=False)  # in mm
    height = db.Column(db.Float, nullable=False)  # in mm
    copper_layers = db.Column(db.Integer, default=2)
    is_public = db.Column(db.Boolean, default=False)

    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    components = db.relationship('Component', lazy='dynamic', cascade='all, delete-orphan')
    nets = db.relationship('Net', lazy='dynamic', cascade='all, delete-orphan')
    design_rules = db.relationship('DesignRule', lazy='dynamic', cascade='all, delete-orphan')
    obstacles = db.relationship('Obstacle', lazy='dynamic', cascade='all, delete-orphan')
    routes = db.relationship('Route', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Board {self.name}>'
