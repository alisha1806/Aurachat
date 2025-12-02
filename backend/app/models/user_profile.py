from app import db
from datetime import datetime, timezone

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    bio = db.Column(db.Text)
    location = db.Column(db.String(100))
    website = db.Column(db.String(200))
    birth_date = db.Column(db.Date)
    avatar_url = db.Column(db.String(500))
    theme_preference = db.Column(db.String(20), default='system')  # 'light', 'dark', 'system'
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def __init__(self, user_id, **kwargs):
        self.user_id = user_id
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self):
        """Convert profile object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'bio': self.bio,
            'location': self.location,
            'website': self.website,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'avatar_url': self.avatar_url,
            'theme_preference': self.theme_preference,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update_from_dict(self, data):
        """Update profile from dictionary data"""
        updatable_fields = ['bio', 'location', 'website', 'birth_date', 'avatar_url', 'theme_preference']
        for field in updatable_fields:
            if field in data:
                setattr(self, field, data[field])
        self.updated_at = datetime.now(timezone.utc)
    
    def __repr__(self):
        return f'<UserProfile {self.user_id}>'