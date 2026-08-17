from .base import BaseModel
from .. import db

class ComponentLibrary(BaseModel):
    """Component library model for storing reusable component libraries."""
    __tablename__ = 'component_libraries'

    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    version = db.Column(db.String(20))
    manufacturer = db.Column(db.String(100))

    # Relationships
    components = db.relationship('Component', backref='library', lazy='dynamic')

    def __repr__(self):
        return f'<ComponentLibrary {self.name}>'