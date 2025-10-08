"""
Recreate database with new schema
This will delete existing data and create fresh tables
"""
import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, Base
from models import *

def recreate_database():
    print("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ All tables dropped")
    
    print("\nCreating new tables with updated schema...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")
    print("\n✨ Database is ready with the new schema!")

if __name__ == "__main__":
    print("⚠️  WARNING: This will delete all existing data!")
    response = input("Do you want to continue? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        recreate_database()
    else:
        print("❌ Operation cancelled")
