"""
Database migration script to add new fields to players table
Run this to update existing database with new columns
"""
from sqlalchemy import create_engine, text
from database import DATABASE_URL

def migrate_database():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Start a transaction
        trans = conn.begin()
        
        try:
            # Add new columns to players table
            migrations = [
                "ALTER TABLE players ADD COLUMN IF NOT EXISTS age INTEGER",
                "ALTER TABLE players ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP",
                "ALTER TABLE players ADD COLUMN IF NOT EXISTS block_name VARCHAR",
                "ALTER TABLE players ADD COLUMN IF NOT EXISTS flat_number VARCHAR",
                "ALTER TABLE players ADD COLUMN IF NOT EXISTS payment_mode VARCHAR",
                "ALTER TABLE players ADD COLUMN IF NOT EXISTS amount FLOAT",
                "ALTER TABLE players ADD COLUMN IF NOT EXISTS payment_transaction_number VARCHAR",
                "ALTER TABLE players ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP",
                "ALTER TABLE players ADD COLUMN IF NOT EXISTS jersey_size VARCHAR",
            ]
            
            for migration in migrations:
                try:
                    conn.execute(text(migration))
                    print(f"✅ Executed: {migration}")
                except Exception as e:
                    print(f"⚠️  Skipped (already exists or error): {migration}")
                    print(f"   Error: {e}")
            
            # Commit the transaction
            trans.commit()
            print("\n✅ Database migration completed successfully!")
            
        except Exception as e:
            # Rollback on error
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    print("Starting database migration...")
    migrate_database()
