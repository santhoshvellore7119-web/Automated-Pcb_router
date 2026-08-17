from .base import BaseModel
from .. import db

class Component(BaseModel):
    """Electronic component model."""
    __tablename__ = 'components'

    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    footprint = db.Column(db.String(100))  # e.g., 'R_0805', 'SOT-23'
    ref_des = db.Column(db.String(10))  # Reference designator (R1, C2, U3, etc.)
    value = db.Column(db.String(50))  # e.g., '10kΩ', '0.1uF'

    # Physical properties
    width = db.Column(db.Float)  # in mm
    height = db.Column(db.Float)  # in mm

    # Position on board
    pos_x = db.Column(db.Float, nullable=False)  # in mm from board origin
    pos_y = db.Column(db.Float, nullable=False)  # in mm from board origin
    rotation = db.Column(db.Float, default=0.0)  # in degrees

    # Layer information
    layer = db.Column(db.Integer, default=1)  # 1=top, 2=bottom, etc.

    # Foreign keys
    board_id = db.Column(db.Integer, db.ForeignKey('boards.id'), nullable=False)
    library_id = db.Column(db.Integer, db.ForeignKey('component_libraries.id'))

    # Relationships
    board = db.relationship('Board', backref=db.backref('components', lazy='dynamic'))
    library = db.relationship('ComponentLibrary', backref=db.backref('components', lazy='dynamic'))

    def __repr__(self):
        return f'<Component {self.ref_des}: {self.name}>'