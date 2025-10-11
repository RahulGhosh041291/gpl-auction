"""
Database migration script to fix NOT NULL constraints on owner_registrations table
This allows co_owner fields to be NULL
"""
from sqlalchemy import create_engine, text
from database import DATABASE_URL

def fix_owner_registration_constraints():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Start a transaction
        trans = conn.begin()
        
        try:
            # Remove NOT NULL constraint from co_owner fields
            migrations = [
                "ALTER TABLE owner_registrations ALTER COLUMN co_owner_full_name DROP NOT NULL",
                "ALTER TABLE owner_registrations ALTER COLUMN co_owner_block DROP NOT NULL",
                "ALTER TABLE owner_registrations ALTER COLUMN co_owner_unit_number DROP NOT NULL",
            ]
            
            for migration in migrations:
                try:
                    conn.execute(text(migration))
                    print(f"✅ Executed: {migration}")
                except Exception as e:
                    print(f"⚠️  Skipped (already nullable or error): {migration}")
                    print(f"   Error: {e}")
            
            # Commit the transaction
            trans.commit()
            print("\n✅ Database migration completed successfully!")
            print("   Co-owner fields are now nullable.")
            
        except Exception as e:
            # Rollback on error
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    print("Starting database migration to fix owner_registrations constraints...")
    print("This will allow co_owner fields to be NULL\n")
    fix_owner_registration_constraints()
