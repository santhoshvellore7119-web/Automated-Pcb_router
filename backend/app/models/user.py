from .base import BaseModel
from .. import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(BaseModel):
    """User model for authentication and authorization."""
    __tablename__ = 'users'

    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256))
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)

    # Relationships
    boards = db.relationship('Board', backref='owner', lazy='dynamic')

    def set_password(self, password):
        """Hash and set password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if provided password matches hash."""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'