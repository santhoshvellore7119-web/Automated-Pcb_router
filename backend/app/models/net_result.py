from .base import BaseModel
from .. import db
import json

class NetResult(BaseModel):
    """Net result model to store the routing result for each net in a routing run."""
    __tablename__ = 'net_results'

    # Status: 'routed', 'unrouted', 'partially_routed'
    status = db.Column(db.String(20), nullable=False)
    # Wire length (in mm)
    wire_length = db.Column(db.Float, default=0.0)
    # Number of vias used
    via_count = db.Column(db.Integer, default=0)
    # Path data (stored as JSON) - list of points or segments
    path_data = db.Column(db.Text)  # JSON string

    # Foreign keys
    routing_run_id = db.Column(db.Integer, db.ForeignKey('routing_runs.id'), nullable=False)
    net_id = db.Column(db.Integer, db.ForeignKey('nets.id'), nullable=False)

    # Relationships (these are already defined through backref in the related models)
    # We don't need to redefine them here since they're set up in the related models

    def get_path_data(self):
        """Get path data as Python object."""
        if self.path_data:
            return json.loads(self.path_data)
        return []

    def set_path_data(self, path_list):
        """Set path data from Python list."""
        self.path_data = json.dumps(path_list) if path_list else None

    def __repr__(self):
        return f'<NetResult for net {self.net_id} in run {self.routing_run_id}>'