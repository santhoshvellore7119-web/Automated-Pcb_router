from .base import BaseModel
from .. import db
import json

class RipupEvent(BaseModel):
    """Ripup event model to store information about each rip-up and reroute event during routing."""
    __tablename__ = 'ripup_events'

    # The net that was ripped up
    net_id = db.Column(db.Integer, db.ForeignKey('nets.id'), nullable=False)
    # The iteration or step at which this rip-up occurred
    iteration = db.Column(db.Integer, nullable=False)
    # Reason for rip-up: e.g., 'congestion', 'overflow', 'design_rule_violation'
    reason = db.Column(db.String(50))
    # The previous path (before rip-up) and new path (after reroute) stored as JSON
    previous_path = db.Column(db.Text)  # JSON string of the path before rip-up
    new_path = db.Column(db.Text)       # JSON string of the path after reroute

    # Foreign keys
    routing_run_id = db.Column(db.Integer, db.ForeignKey('routing_runs.id'), nullable=False)

    def get_previous_path(self):
        """Get previous path as Python object."""
        if self.previous_path:
            return json.loads(self.previous_path)
        return []

    def set_previous_path(self, path_list):
        """Set previous path from Python list."""
        self.previous_path = json.dumps(path_list) if path_list else None

    def get_new_path(self):
        """Get new path as Python object."""
        if self.new_path:
            return json.loads(self.new_path)
        return []

    def set_new_path(self, path_list):
        """Set new path from Python list."""
        self.new_path = json.dumps(path_list) if path_list else None

    def __repr__(self):
        return f'<RipupEvent for net {self.net_id} in run {self.routing_run_id} iteration {self.iteration}>'