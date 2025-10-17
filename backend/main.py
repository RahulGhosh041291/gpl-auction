from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from database import engine, Base, get_db
from routers import players, teams, auction, payments, registration, auth, owner_registration

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize default users
from auth import init_default_users
db = next(get_db())
init_default_users(db)
db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown

app = FastAPI(
    title="Galaxia Premier League Season 2",
    description="IPL-style auction system for cricket tournament",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
# origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
origins = ["http://localhost:3000", "https://gpl-season-2.netlify.app", "http://gpl-auction-frontend-rahul-2025.s3-website.ap-south-1.amazonaws.com", "https://d1c1mf21vnebye.cloudfront.net"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(auction.router, prefix="/api/auction", tags=["auction"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(registration.router, prefix="/api/registration", tags=["registration"])
app.include_router(owner_registration.router, prefix="/api", tags=["owner-registration"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Galaxia Premier League Season 2 Auction System",
        "version": "2.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/admin/migrate-owner-registrations")
async def migrate_owner_registrations():
    """
    One-time migration endpoint to fix owner_registrations table constraints.
    This endpoint can be called once to update the database schema.
    """
    from sqlalchemy import text
    try:
        db = next(get_db())
        migrations = [
            "ALTER TABLE owner_registrations ALTER COLUMN co_owner_full_name DROP NOT NULL",
            "ALTER TABLE owner_registrations ALTER COLUMN co_owner_block DROP NOT NULL",
            "ALTER TABLE owner_registrations ALTER COLUMN co_owner_unit_number DROP NOT NULL",
        ]
        
        results = []
        for migration in migrations:
            try:
                db.execute(text(migration))
                db.commit()
                results.append({"sql": migration, "status": "success"})
            except Exception as e:
                results.append({"sql": migration, "status": "skipped", "error": str(e)})
        
        db.close()
        return {
            "status": "completed",
            "message": "Migration executed successfully",
            "results": results
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/api/admin/migrate-add-auction-order")
async def migrate_add_auction_order():
    """
    One-time migration endpoint to add auction_order column to players table.
    This endpoint can be called once to update the database schema.
    """
    from sqlalchemy import text
    try:
        db = next(get_db())
        migration = "ALTER TABLE players ADD COLUMN IF NOT EXISTS auction_order INTEGER"
        
        db.execute(text(migration))
        db.commit()
        db.close()
        
        return {
            "status": "completed",
            "message": "auction_order column added successfully",
            "sql": migration
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
