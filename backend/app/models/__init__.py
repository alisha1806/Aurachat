from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import re

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationship
    profile = db.relationship('UserProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        if len(password) < 6:
            raise ValueError('Password must be at least 6 characters long')
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def validate_username(self, username):
        """Validate username format"""
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        if len(username) < 3 or len(username) > 20:
            raise ValueError('Username must be between 3 and 20 characters')
    
    def validate_email(self, email):
        """Validate email format"""
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            raise ValueError('Invalid email format')
    
    def update_last_seen(self):
        """Update user's last seen timestamp"""
        self.last_seen = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self, include_profile=True):
        """Convert user to dictionary"""
        user_data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'is_active': self.is_active
        }
        
        if include_profile and self.profile:
            user_data['profile'] = self.profile.to_dict()
        
        return user_data


class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Profile Information
    full_name = db.Column(db.String(120))
    bio = db.Column(db.Text)
    avatar_data = db.Column(db.LargeBinary)  # Store image as binary data
    avatar_mimetype = db.Column(db.String(50))  # Store MIME type (image/jpeg, image/png, etc.)
    location = db.Column(db.String(100))
    website = db.Column(db.String(255))
    
    # Theme and Display Preferences
    theme_preference = db.Column(db.String(20), default='light')  # 'light' or 'dark'
    language = db.Column(db.String(10), default='en')
    timezone = db.Column(db.String(50))
    
    # Privacy Settings
    profile_visibility = db.Column(db.String(20), default='public')  # 'public', 'friends', 'private'
    email_notifications = db.Column(db.Boolean, default=True)
    
    # Additional customization
    custom_status = db.Column(db.String(200))
    birth_date = db.Column(db.Date)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert profile to dictionary"""
        # Convert avatar binary data to base64 for JSON serialization
        avatar_data_b64 = None
        if self.avatar_data:
            import base64
            avatar_data_b64 = base64.b64encode(self.avatar_data).decode('utf-8')
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'bio': self.bio,
            'avatar_data': avatar_data_b64,
            'avatar_mimetype': self.avatar_mimetype,
            'location': self.location,
            'website': self.website,
            'theme_preference': self.theme_preference,
            'language': self.language,
            'timezone': self.timezone,
            'profile_visibility': self.profile_visibility,
            'email_notifications': self.email_notifications,
            'custom_status': self.custom_status,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def update_theme(self, theme):
        """Update user's theme preference"""
        if theme not in ['light', 'dark']:
            raise ValueError('Theme must be either light or dark')
        self.theme_preference = theme
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_profile_info(self, data):
        """Update profile information"""
        allowed_fields = [
            'full_name', 'bio', 'location', 'website', 'language', 
            'timezone', 'profile_visibility', 'email_notifications', 
            'custom_status', 'birth_date', 'theme_preference'
        ]
        
        for field in allowed_fields:
            if field in data:
                if field == 'birth_date' and data[field]:
                    # Parse date string
                    if isinstance(data[field], str):
                        self.birth_date = datetime.strptime(data[field], '%Y-%m-%d').date()
                    else:
                        setattr(self, field, data[field])
                else:
                    setattr(self, field, data[field])
        
        # Handle avatar data separately
        if 'avatar_data' in data:
            self.avatar_data = data['avatar_data']
        if 'avatar_mimetype' in data:
            self.avatar_mimetype = data['avatar_mimetype']
        
        self.updated_at = datetime.utcnow()
        db.session.commit()