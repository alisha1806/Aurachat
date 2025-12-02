import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const fileInputRef = useRef();

  const [profile, setProfile] = useState({
    bio: '',
    location: '',
    website: '',
    birth_date: '',
    theme_preference: 'system',
    avatar_data: '',
    avatar_mimetype: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile');
        setProfile(response.data);
        // Set avatar preview from base64 data
        if (response.data.avatar_data && response.data.avatar_mimetype) {
          setAvatarPreview(`data:${response.data.avatar_mimetype};base64,${response.data.avatar_data}`);
        }
      } catch (err) {
        showMessage('Failed to load profile information', 'error');
        console.error('Profile fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file', 'error');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('Image size must be less than 5MB', 'error');
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setProfile(prev => ({ ...prev, avatar_data: '', avatar_mimetype: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add profile fields
      Object.keys(profile).forEach(key => {
        if (key !== 'avatar_data' && key !== 'avatar_mimetype') {
          formData.append(key, profile[key] || '');
        }
      });

      // Add avatar file if selected
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await api.put('/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update profile state with response
      setProfile(response.data);
      // Set avatar preview from response if available
      if (response.data.avatar_data && response.data.avatar_mimetype) {
        setAvatarPreview(`data:${response.data.avatar_mimetype};base64,${response.data.avatar_data}`);
      }

      // Update user context if username changed
      if (response.data.username && response.data.username !== user.username) {
        updateUser({ ...user, username: response.data.username });
      }

      showMessage('Profile updated successfully!', 'success');
      setAvatarFile(null);
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      showMessage(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-loading" style={{
        minHeight: 'calc(100vh - var(--navbar-height))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="text-center">
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page fade-in" style={{
      minHeight: 'calc(100vh - var(--navbar-height))',
      padding: '2rem 0'
    }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div className="profile-header mb-4">
          <h1 style={{ marginBottom: '0.5rem' }}>Profile Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Customize your AuraChat profile and preferences
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`alert alert-${messageType === 'error' ? 'danger' : 'success'} mb-4`} style={{
            backgroundColor: messageType === 'error' ? 
              'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)',
            border: `1px solid var(--${messageType === 'error' ? 'danger' : 'success'}-color)`,
            borderRadius: 'var(--border-radius)',
            padding: '1rem',
            color: `var(--${messageType === 'error' ? 'danger' : 'success'}-color)`
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gap: '2rem',
            gridTemplateColumns: '1fr'
          }}>
            {/* Avatar Section */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>🖼️ Profile Picture</h3>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: avatarPreview ? 
                      `url(${avatarPreview}) center/cover` : 
                      'var(--primary-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    border: '4px solid var(--border-color)'
                  }}>
                    {!avatarPreview && (user?.username?.charAt(0).toUpperCase() || 'U')}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {avatarPreview ? 'Current Avatar' : 'Default Avatar'}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="btn btn-primary"
                      style={{ marginRight: '0.5rem' }}
                    >
                      Upload New Avatar
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="btn btn-outline"
                      >
                        Remove Avatar
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Supported formats: JPG, PNG, GIF (max 5MB)
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>👤 Basic Information</h3>
              
              <div style={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
              }}>
                <div>
                  <label htmlFor="username" style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={user?.username || ''}
                    disabled
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      cursor: 'not-allowed',
                      opacity: 0.7
                    }}
                  />
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Username cannot be changed
                  </div>
                </div>

                <div>
                  <label htmlFor="email" style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      cursor: 'not-allowed',
                      opacity: 0.7
                    }}
                  />
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Email cannot be changed
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="bio" style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                    rows="3"
                    maxLength="500"
                    style={{ resize: 'vertical' }}
                  />
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.25rem',
                    textAlign: 'right'
                  }}>
                    {profile.bio.length}/500 characters
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>📍 Additional Information</h3>
              
              <div style={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
              }}>
                <div>
                  <label htmlFor="location" style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    placeholder="e.g., New York, USA"
                    maxLength="100"
                  />
                </div>

                <div>
                  <label htmlFor="website" style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={profile.website}
                    onChange={handleChange}
                    placeholder="https://yourwebsite.com"
                    maxLength="200"
                  />
                </div>

                <div>
                  <label htmlFor="birth_date" style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>
                    Birth Date
                  </label>
                  <input
                    type="date"
                    id="birth_date"
                    name="birth_date"
                    value={profile.birth_date}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Theme Preferences */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>🎨 Theme Preferences</h3>
              
              <div>
                <label htmlFor="theme_preference" style={{
                  display: 'block',
                  marginBottom: '1rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Preferred Theme
                </label>
                
                <div style={{
                  display: 'grid',
                  gap: '1rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                }}>
                  {[
                    { value: 'light', label: '☀️ Light Mode', desc: 'Bright and clean interface' },
                    { value: 'dark', label: '🌙 Dark Mode', desc: 'Easy on the eyes' },
                    { value: 'system', label: '🔄 System Default', desc: 'Follows device settings' }
                  ].map(option => (
                    <div
                      key={option.value}
                      onClick={() => handleChange({ target: { name: 'theme_preference', value: option.value } })}
                      style={{
                        padding: '1rem',
                        border: `2px solid ${profile.theme_preference === option.value ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--border-radius)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        backgroundColor: profile.theme_preference === option.value ? 
                          'rgba(102, 126, 234, 0.1)' : 'var(--bg-card)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <input
                          type="radio"
                          name="theme_preference"
                          value={option.value}
                          checked={profile.theme_preference === option.value}
                          onChange={handleChange}
                          style={{ margin: 0 }}
                        />
                        <span style={{ fontWeight: '500' }}>{option.label}</span>
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}>
                        {option.desc}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '0.875rem'
                }}>
                  <strong>💡 Current Status:</strong> You're using <strong>{theme}</strong> mode.
                  {profile.theme_preference === 'system' && (
                    <span> This follows your device's theme settings.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
                style={{
                  minWidth: '200px',
                  padding: '12px 2rem'
                }}
              >
                {isSaving ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="loading-spinner"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;