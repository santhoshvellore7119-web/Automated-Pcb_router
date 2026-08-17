from .base import BaseModel
from .. import db

class Net(BaseModel):
    """Electrical net/model for PCB routing."""
    __tablename__ = 'nets'

    name = db.Column(db.String(100), nullable=False)
    # In a more complex implementation, nets would have multiple points/pins
    # For our routing algorithm, we'll store simplified representation

    # Foreign keys
    board_id = db.Column(db.Integer, db.ForeignKey('boards.id'), nullable=False)

    # Relationships
    board = db.relationship('Board', backref=db.backref('nets', lazy='dynamic'))
    # Net results will be linked through the routing_run relationship
    # We don't need a direct relationship here as net results go through routing runs

    def __repr__(self):
        return f'<Net {self.name}>'