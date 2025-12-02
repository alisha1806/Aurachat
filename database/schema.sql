-- AuraChat Database Schema for MySQL Workbench
-- Version: 1.0

-- Create database
CREATE DATABASE IF NOT EXISTS aurachat
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE aurachat;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    
    -- Basic profile information
    full_name VARCHAR(120),
    bio TEXT,
    avatar_url VARCHAR(255),
    location VARCHAR(100),
    website VARCHAR(255),
    
    -- Theme and display preferences
    theme_preference ENUM('light', 'dark') DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    
    -- Privacy settings
    profile_visibility ENUM('public', 'friends', 'private') DEFAULT 'public',
    email_notifications BOOLEAN DEFAULT TRUE,
    
    -- Additional customization
    custom_status VARCHAR(200),
    birth_date DATE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_theme (theme_preference),
    INDEX idx_visibility (profile_visibility)
);

-- Create uploads directory structure (for reference)
-- In your application, create these directories:
-- static/
-- ├── uploads/
--     ├── avatars/
--     └── images/

-- Sample data for testing (optional - remove in production)
-- INSERT INTO users (username, email, password_hash) VALUES
-- ('testuser', 'test@aurachat.com', '$2b$12$LQv3c1yqBwdnZXFr0DqmUOv0A2LcNlGaEzOcCF/h.j.D8RlDqZLge');
-- 
-- INSERT INTO user_profiles (user_id, full_name, bio, theme_preference) VALUES
-- (1, 'Test User', 'This is a test user profile', 'light');

-- Indexes for performance optimization
CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_profiles_updated_at ON user_profiles(updated_at);

-- Views for common queries
CREATE VIEW user_with_profile AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.created_at,
    u.last_seen,
    u.is_active,
    p.full_name,
    p.bio,
    p.avatar_url,
    p.location,
    p.website,
    p.theme_preference,
    p.language,
    p.timezone,
    p.profile_visibility,
    p.email_notifications,
    p.custom_status,
    p.birth_date,
    p.updated_at as profile_updated_at
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.is_active = TRUE;
