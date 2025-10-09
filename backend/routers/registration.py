from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Player as PlayerModel, Payment as PaymentModel, PlayerStatus
import models
import schemas

router = APIRouter()

# Try to import required packages for web scraping
try:
    import requests
    from bs4 import BeautifulSoup
    import re
    SCRAPING_AVAILABLE = True
except ImportError:
    SCRAPING_AVAILABLE = False
    print("Warning: Web scraping packages not available. Player data fetching will be limited.")

async def fetch_cricheroes_data(cricheroes_id: str):
    """
    Fetch player data from CricHeroes profile
    
    Args:
        cricheroes_id: Can be either:
            - Full profile URL: https://cricheroes.in/player-profile/12345/player-name
            - Profile ID: 12345
            - Profile path: 12345/player-name
    
    Returns:
        dict: Player statistics or None if fetch fails
    """
    if not SCRAPING_AVAILABLE:
        print("Warning: Web scraping not available")
        return None
    
    try:
        # Parse the cricheroes_id to get the profile URL
        if cricheroes_id.startswith('http'):
            profile_url = cricheroes_id
        elif '/' in cricheroes_id:
            # Format: 12345/player-name
            profile_url = f"https://cricheroes.in/player-profile/{cricheroes_id}"
        else:
            # Just the ID, need to construct URL (may not work without player name)
            profile_url = f"https://cricheroes.in/player-profile/{cricheroes_id}/"
        
        print(f"Fetching CricHeroes data from: {profile_url}")
        
        # Set headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        }
        
        # Fetch the profile page
        response = requests.get(profile_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Initialize player data dictionary
        player_data = {
            "matches_played": 0,
            "runs_scored": 0,
            "wickets_taken": 0,
            "batting_average": 0.0,
            "bowling_average": 0.0,
            "strike_rate": 0.0,
            "batting_style": None,
            "bowling_style": None
        }
        
        # Try to extract statistics from the page
        # Note: This is based on typical CricHeroes page structure
        # The actual selectors may need adjustment based on the current site structure
        
        # Look for stats in various possible locations
        stats_divs = soup.find_all('div', class_=re.compile(r'stat|statistic|career', re.I))
        
        for stat_div in stats_divs:
            text = stat_div.get_text().lower()
            
            # Extract matches played
            if 'match' in text and ('played' in text or 'mat' in text):
                numbers = re.findall(r'\d+', text)
                if numbers:
                    player_data["matches_played"] = int(numbers[0])
            
            # Extract runs
            if 'run' in text and 'scored' not in text.split('run')[0][-10:]:
                numbers = re.findall(r'\d+', text)
                if numbers:
                    player_data["runs_scored"] = int(numbers[0])
            
            # Extract wickets
            if 'wicket' in text or 'wkt' in text:
                numbers = re.findall(r'\d+', text)
                if numbers:
                    player_data["wickets_taken"] = int(numbers[0])
            
            # Extract batting average
            if 'batting' in text and 'avg' in text or 'batting' in text and 'average' in text:
                numbers = re.findall(r'\d+\.?\d*', text)
                if numbers:
                    player_data["batting_average"] = float(numbers[0])
            
            # Extract strike rate
            if 'strike' in text and 'rate' in text:
                numbers = re.findall(r'\d+\.?\d*', text)
                if numbers:
                    player_data["strike_rate"] = float(numbers[0])
            
            # Extract bowling average
            if 'bowling' in text and ('avg' in text or 'average' in text):
                numbers = re.findall(r'\d+\.?\d*', text)
                if numbers:
                    player_data["bowling_average"] = float(numbers[0])
        
        # Try to extract batting and bowling style
        style_divs = soup.find_all(['div', 'span', 'p'], class_=re.compile(r'style|info', re.I))
        for style_div in style_divs:
            text = style_div.get_text()
            
            if 'batting' in text.lower() and any(x in text.lower() for x in ['right', 'left', 'hand']):
                player_data["batting_style"] = text.strip()
            
            if 'bowling' in text.lower() and any(x in text.lower() for x in ['right', 'left', 'arm', 'spin', 'fast']):
                player_data["bowling_style"] = text.strip()
        
        # Check if we got any meaningful data
        if player_data["matches_played"] > 0 or player_data["runs_scored"] > 0 or player_data["wickets_taken"] > 0:
            print(f"Successfully fetched CricHeroes data: {player_data}")
            return player_data
        else:
            print("Could not extract player statistics from CricHeroes profile")
            print("Page title:", soup.title.string if soup.title else "No title")
            return None
            
    except requests.RequestException as e:
        print(f"Error fetching CricHeroes data (network error): {e}")
        return None
    except Exception as e:
        print(f"Error parsing CricHeroes data: {e}")
        import traceback
        traceback.print_exc()
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
    if not SCRAPING_AVAILABLE:
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
