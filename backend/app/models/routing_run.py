from .base import BaseModel
from .. import db
import json
from datetime import datetime

class RoutingRun(BaseModel):
    """Routing run model to store information about each routing algorithm execution."""
    __tablename__ = 'routing_runs'

    # Algorithm used: 'lee', 'astar', 'ripup_reroute'
    algorithm = db.Column(db.String(50), nullable=False)
    # Parameters used for the algorithm (stored as JSON)
    parameters = db.Column(db.Text)  # JSON string
    # Status: 'pending', 'running', 'completed', 'failed'
    status = db.Column(db.String(20), default='pending')
    # Results summary (stored as JSON) - statistics like success rate, avg wirelength, etc.
    results_summary = db.Column(db.Text)  # JSON string
    # Timestamps
    started_at = db.Column(db.DateTime)
    ended_at = db.Column(db.DateTime)

    # Foreign keys
    board_id = db.Column(db.Integer, db.ForeignKey('boards.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    # Net results for this routing run
    net_results = db.relationship('NetResult', backref='routing_run', lazy='dynamic', cascade='all, delete-orphan')
    # Ripup events for this routing run (mainly for ripup_reroute algorithm)
    ripup_events = db.relationship('RipupEvent', backref='routing_run', lazy='dynamic', cascade='all, delete-orphan')

    def get_parameters(self):
        """Get parameters as Python object."""
        if self.parameters:
            return json.loads(self.parameters)
        return {}

    def set_parameters(self, params_dict):
        """Set parameters from Python object."""
        self.parameters = json.dumps(params_dict) if params_dict else None

    def get_results_summary(self):
        """Get results summary as Python object."""
        if self.results_summary:
            return json.loads(self.results_summary)
        return {}

    def set_results_summary(self, summary_dict):
        """Set results summary from Python object."""
        self.results_summary = json.dumps(summary_dict) if summary_dict else None

    def __repr__(self):
        return f'<RoutingRun {self.algorithm} for board {self.board_id} ({self.status})>'