from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Player as PlayerModel, Payment as PaymentModel, PlayerStatus
import models
import schemas

router = APIRouter()

# Try to import cricheroes, but don't fail if not available
try:
    import cricheroes
    CRICHEROES_AVAILABLE = True
except ImportError:
    CRICHEROES_AVAILABLE = False
    print("Warning: cricheroes package not available. Player data fetching will be limited.")

async def fetch_cricheroes_data(cricheroes_id: str):
    """Fetch player data from Cricheroes API"""
    if not CRICHEROES_AVAILABLE:
        return None
    
    try:
        # This is a placeholder - actual implementation depends on cricheroes API
        # The cricheroes package might have different methods
        # You'll need to check the actual package documentation
        player_data = {
            "matches_played": 0,
            "runs_scored": 0,
            "wickets_taken": 0,
            "batting_average": 0.0,
            "bowling_average": 0.0,
            "strike_rate": 0.0,
            "batting_style": "Right-hand bat",
            "bowling_style": "Right-arm fast"
        }
        return player_data
    except Exception as e:
        print(f"Error fetching Cricheroes data: {e}")
        return None

@router.post("/register", response_model=schemas.Player)
async def register_player(
    registration: schemas.PlayerRegistration,
    db: Session = Depends(get_db)
):
    """Register a new player for the auction"""
    # Debug logging
    print(f"\n=== REGISTRATION DEBUG ===")
    print(f"Player name: {registration.name}")
    print(f"Has player_image: {bool(registration.player_image)}")
    if registration.player_image:
        print(f"Image length: {len(registration.player_image)}")
        print(f"Image starts with: {registration.player_image[:50]}")
    print(f"=== END DEBUG ===\n")
    
    # Check if email already exists
    existing_player = db.query(PlayerModel).filter(
        PlayerModel.email == registration.email
    ).first()
    
    if existing_player:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create player record with all fields
    player = PlayerModel(
        name=registration.name,
        email=registration.email,
        phone=registration.phone,
        age=registration.age,
        date_of_birth=registration.date_of_birth,
        role=registration.role,
        batting_style=registration.batting_style,
        bowling_style=registration.bowling_style,
        block_name=registration.block_name,
        flat_number=registration.flat_number,
        payment_mode=registration.payment_mode,
        amount=registration.amount,
        payment_transaction_number=registration.payment_transaction_number,
        payment_date=registration.payment_date,
        jersey_size=registration.jersey_size,
        cricheroes_id=registration.cricheroes_id,
        bio=registration.bio,
        player_image=registration.player_image,  # Store player image URL
        status=PlayerStatus.AVAILABLE,
        registration_fee_paid=True,
        has_cricheroes_data=bool(registration.cricheroes_id)
    )
    
    # Fetch Cricheroes data if ID provided
    if registration.cricheroes_id:
        cricheroes_data = await fetch_cricheroes_data(registration.cricheroes_id)
        
        if cricheroes_data:
            player.has_cricheroes_data = True
            player.matches_played = cricheroes_data.get("matches_played", 0)
            player.runs_scored = cricheroes_data.get("runs_scored", 0)
            player.wickets_taken = cricheroes_data.get("wickets_taken", 0)
            player.batting_average = cricheroes_data.get("batting_average", 0.0)
            player.bowling_average = cricheroes_data.get("bowling_average", 0.0)
            player.strike_rate = cricheroes_data.get("strike_rate", 0.0)
            if not player.batting_style:
                player.batting_style = cricheroes_data.get("batting_style")
            if not player.bowling_style:
                player.bowling_style = cricheroes_data.get("bowling_style")
    
    db.add(player)
    db.commit()
    db.refresh(player)
    
    return player

@router.get("/check-email/{email}")
async def check_email_availability(email: str, db: Session = Depends(get_db)):
    """Check if an email is already registered"""
    existing = db.query(PlayerModel).filter(PlayerModel.email == email).first()
    return {"available": existing is None}

@router.get("/check-cricheroes/{cricheroes_id}")
async def check_cricheroes_data(cricheroes_id: str):
    """Check if Cricheroes data is available for a player ID"""
    if not CRICHEROES_AVAILABLE:
        return {
            "available": False,
            "message": "Cricheroes integration not available"
        }
    
    data = await fetch_cricheroes_data(cricheroes_id)
    return {
        "available": data is not None,
        "data": data if data else None
    }

@router.post("/complete-registration/{player_id}")
async def complete_registration(player_id: int, db: Session = Depends(get_db)):
    """Mark player as available after payment confirmation"""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if not player.registration_fee_paid:
        raise HTTPException(status_code=400, detail="Registration fee not paid")
    
    player.status = PlayerStatus.AVAILABLE
    db.commit()
    
    return {"message": "Registration completed successfully"}
