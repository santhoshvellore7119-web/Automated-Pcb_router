from .base import BaseModel
from .. import db
import json

class Obstacle(BaseModel):
    """Obstacle model for PCB design obstacles (mounting holes, keep-out areas, etc.)."""
    __tablename__ = 'obstacles'

    name = db.Column(db.String(100), nullable=False)
    # Obstacle types: mounting_hole, keepout, keepin, via, component_pad, etc.
    obstacle_type = db.Column(db.String(50), nullable=False)
    # Geometry stored as JSON (could be points for polygon, circle parameters, etc.)
    geometry = db.Column(db.Text)  # JSON string
    # Layer information (optional, as some obstacles might span layers)
    layer = db.Column(db.Integer)

    # Foreign keys
    board_id = db.Column(db.Integer, db.ForeignKey('boards.id'), nullable=False)

    def get_geometry(self):
        """Get geometry as Python object."""
        if self.geometry:
            return json.loads(self.geometry)
        return None

    def set_geometry(self, geometry_obj):
        """Set geometry from Python object."""
        self.geometry = json.dumps(geometry_obj) if geometry_obj else None

    def __repr__(self):
        return f'<Obstacle {self.name} ({self.obstacle_type})>'