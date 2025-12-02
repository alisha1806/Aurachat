from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, UserProfile
from datetime import datetime
from PIL import Image
import io
import base64

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user's profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Return the profile data directly
        profile_data = user.to_dict()
        return jsonify(profile_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Handle both JSON and multipart form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        # Handle avatar upload if present
        if 'avatar' in request.files:
            file = request.files['avatar']
            
            if file and file.filename != '':
                # Check file extension and MIME type
                allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
                allowed_mimetypes = {'image/png', 'image/jpeg', 'image/gif'}
                
                if not ('.' in file.filename and 
                        file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
                    return jsonify({'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF'}), 400
                
                if file.mimetype not in allowed_mimetypes:
                    return jsonify({'error': 'Invalid file MIME type'}), 400
                
                # Process and resize image
                image = Image.open(file.stream)
                
                # Resize to a standard size (e.g., 200x200)
                image = image.resize((200, 200), Image.Resampling.LANCZOS)
                
                # Convert to RGB if necessary
                if image.mode in ("RGBA", "P"):
                    image = image.convert("RGB")
                
                # Convert image to binary data
                img_buffer = io.BytesIO()
                image.save(img_buffer, format='JPEG', quality=85)
                img_binary = img_buffer.getvalue()
                
                # Add avatar data to update data
                data['avatar_data'] = img_binary
                data['avatar_mimetype'] = 'image/jpeg'
        
        # Update user profile
        if user.profile:
            user.profile.update_profile_info(data)
        else:
            # Create profile if it doesn't exist
            profile = UserProfile(user_id=user_id)
            profile.update_profile_info(data)
            db.session.add(profile)
            db.session.commit()
        
        return jsonify(user.profile.to_dict() if user.profile else {}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Profile update failed: {str(e)}'}), 500


@profile_bp.route('/profile/theme', methods=['PUT'])
@jwt_required()
def update_theme():
    """Update user's theme preference"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        theme = data.get('theme')
        
        if theme not in ['light', 'dark']:
            return jsonify({'error': 'Theme must be either light or dark'}), 400
        
        # Update theme preference
        if user.profile:
            user.profile.update_theme(theme)
        else:
            # Create profile if it doesn't exist
            profile = UserProfile(user_id=user_id, theme_preference=theme)
            db.session.add(profile)
            db.session.commit()
        
        return jsonify({
            'message': 'Theme updated successfully',
            'theme': theme
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Theme update failed: {str(e)}'}), 500


@profile_bp.route('/profile/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    """Upload user avatar"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if 'avatar' not in request.files:
            return jsonify({'error': 'No avatar file provided'}), 400
        
        file = request.files['avatar']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file extension and MIME type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        allowed_mimetypes = {'image/png', 'image/jpeg', 'image/gif'}
        
        if not ('.' in file.filename and 
                file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF'}), 400
        
        if file.mimetype not in allowed_mimetypes:
            return jsonify({'error': 'Invalid file MIME type'}), 400
        
        # Process and resize image
        image = Image.open(file.stream)
        
        # Resize to a standard size (e.g., 200x200)
        image = image.resize((200, 200), Image.Resampling.LANCZOS)
        
        # Convert to RGB if necessary
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
        # Convert image to binary data
        import io
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='JPEG', quality=85)
        img_binary = img_buffer.getvalue()
        
        # Update user profile
        if user.profile:
            user.profile.avatar_data = img_binary
            user.profile.avatar_mimetype = 'image/jpeg'
            user.profile.updated_at = datetime.utcnow()
        else:
            profile = UserProfile(
                user_id=user_id, 
                avatar_data=img_binary,
                avatar_mimetype='image/jpeg'
            )
            db.session.add(profile)
        
        db.session.commit()
        
        # Return base64 encoded avatar for immediate display
        import base64
        avatar_b64 = base64.b64encode(img_binary).decode('utf-8')
        
        return jsonify({
            'message': 'Avatar uploaded successfully',
            'avatar_data': avatar_b64,
            'avatar_mimetype': 'image/jpeg'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Avatar upload failed: {str(e)}'}), 500


@profile_bp.route('/profile/avatar/<int:user_id>', methods=['GET'])
def get_avatar(user_id):
    """Get user avatar image"""
    try:
        user = User.query.get(user_id)
        
        if not user or not user.profile or not user.profile.avatar_data:
            return jsonify({'error': 'Avatar not found'}), 404
        
        # Return binary image data
        return send_file(
            io.BytesIO(user.profile.avatar_data),
            mimetype=user.profile.avatar_mimetype or 'image/jpeg',
            as_attachment=False
        )
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve avatar: {str(e)}'}), 500


@profile_bp.route('/profile/avatar', methods=['DELETE'])
@jwt_required()
def delete_avatar():
    """Delete user avatar"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.profile:
            user.profile.avatar_data = None
            user.profile.avatar_mimetype = None
            user.profile.updated_at = datetime.utcnow()
            db.session.commit()
        
        return jsonify({'message': 'Avatar deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete avatar: {str(e)}'}), 500


@profile_bp.route('/profile/settings', methods=['GET'])
@jwt_required()
def get_settings():
    """Get user settings"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        settings = {
            'theme': user.profile.theme_preference if user.profile else 'light',
            'language': user.profile.language if user.profile else 'en',
            'email_notifications': user.profile.email_notifications if user.profile else True,
            'profile_visibility': user.profile.profile_visibility if user.profile else 'public'
        }
        
        return jsonify({'settings': settings}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@profile_bp.route('/profile/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    """Update user settings"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate settings
        if 'theme' in data and data['theme'] not in ['light', 'dark']:
            return jsonify({'error': 'Invalid theme value'}), 400
        
        if 'profile_visibility' in data and data['profile_visibility'] not in ['public', 'friends', 'private']:
            return jsonify({'error': 'Invalid profile visibility value'}), 400
        
        # Update settings
        if user.profile:
            user.profile.update_profile_info(data)
        else:
            # Create profile if it doesn't exist
            profile = UserProfile(user_id=user_id)
            profile.update_profile_info(data)
            db.session.add(profile)
            db.session.commit()
        
        return jsonify({'message': 'Settings updated successfully'}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Settings update failed: {str(e)}'}), 500