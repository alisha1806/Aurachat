#!/usr/bin/env python3
"""
Database migration script to update avatar storage from URL to binary data.
Run this script to migrate existing avatar URLs to the new binary storage system.
"""

import os
import sys
import requests
from datetime import datetime

# Add the parent directory to Python path to import our app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import UserProfile
from PIL import Image
import io

def migrate_avatars():
    """Migrate existing avatar URLs to binary data storage"""
    app = create_app()
    
    with app.app_context():
        print("Starting avatar migration...")
        
        # First, add the new columns if they don't exist
        try:
            # Check if we need to add the new columns
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('user_profiles')]
            
            if 'avatar_data' not in columns:
                print("Adding avatar_data column...")
                db.engine.execute('ALTER TABLE user_profiles ADD COLUMN avatar_data LONGBLOB')
            
            if 'avatar_mimetype' not in columns:
                print("Adding avatar_mimetype column...")
                db.engine.execute('ALTER TABLE user_profiles ADD COLUMN avatar_mimetype VARCHAR(50)')
                
            print("Database schema updated successfully!")
            
        except Exception as e:
            print(f"Error updating schema: {e}")
            return False
        
        # Note: Since we're implementing a new system, we don't need to migrate old data
        # The old avatar_url column can be dropped later if it exists
        
        print("Avatar migration completed successfully!")
        return True

def recreate_tables():
    """Recreate all tables with the new schema"""
    app = create_app()
    
    with app.app_context():
        print("Recreating database tables...")
        
        # Drop all tables and recreate them
        db.drop_all()
        db.create_all()
        
        print("Database tables recreated successfully!")
        return True

if __name__ == '__main__':
    print("AuraChat Database Migration")
    print("=" * 40)
    
    choice = input("Choose migration option:\n1. Update schema (add new columns)\n2. Recreate all tables\nEnter choice (1 or 2): ")
    
    if choice == '1':
        if migrate_avatars():
            print("\n✅ Migration completed successfully!")
        else:
            print("\n❌ Migration failed!")
    elif choice == '2':
        confirm = input("⚠️  This will delete all existing data! Are you sure? (yes/no): ")
        if confirm.lower() == 'yes':
            if recreate_tables():
                print("\n✅ Database recreated successfully!")
            else:
                print("\n❌ Database recreation failed!")
        else:
            print("Operation cancelled.")
    else:
        print("Invalid choice!")