from .base import BaseModel
from .. import db

class DesignRule(BaseModel):
    """Design rule model for PCB design rules (clearance, trace width, etc.)."""
    __tablename__ = 'design_rules'

    name = db.Column(db.String(100), nullable=False)
    rule_type = db.Column(db.String(50), nullable=False)  # e.g., 'clearance', 'trace_width', 'via_size', 'hole_size'
    value = db.Column(db.Float, nullable=False)  # The value of the rule (in mm or appropriate units)

    # Foreign keys
    board_id = db.Column(db.Integer, db.ForeignKey('boards.id'), nullable=False)

    def __repr__(self):
        return f'<DesignRule {self.name}: {self.value} {self.rule_type}>'