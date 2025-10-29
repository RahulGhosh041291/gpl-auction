from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Team as TeamModel, PlayerStatus, User
from auth import get_current_admin_user
import schemas

router = APIRouter()

MINIMUM_PLAYERS = 13
BASE_PLAYER_PRICE = 10000

def calculate_max_bid_limit(team: TeamModel) -> float:
    """Calculate maximum bid limit for a team based on remaining budget and players needed"""
    players_still_needed = MINIMUM_PLAYERS - team.players_count
    if players_still_needed <= 0:
        # Team has met minimum requirement, can bid full remaining budget
        return team.remaining_budget
    else:
        # Must reserve money for remaining minimum players
        reserved_amount = (players_still_needed - 1) * BASE_PLAYER_PRICE
        max_bid = team.remaining_budget - reserved_amount
        return max(max_bid, BASE_PLAYER_PRICE)

@router.get("/")
async def get_all_teams(db: Session = Depends(get_db)):
    """Get all teams with their current budget and player count"""
    teams = db.query(TeamModel).all()
    result = []
    for team in teams:
        team_dict = {
            "id": team.id,
            "name": team.name,
            "short_name": team.short_name,
            "logo_url": team.logo_url,
            "team_logo": team.team_logo,
            "color_primary": team.color_primary,
            "color_secondary": team.color_secondary,
            "budget": team.budget,
            "remaining_budget": team.remaining_budget,
            "players_count": team.players_count,
            "created_at": team.created_at,
            "max_bid_limit": calculate_max_bid_limit(team),
            "owner_name": team.owner_name,
            "owner_email": team.owner_email,
            "owner_phone": team.owner_phone,
            "sponsor_name": team.sponsor_name,
            "sponsor_details": team.sponsor_details,
            "about_us": team.about_us,
            "team_registered": team.team_registered
        }
        result.append(team_dict)
    return result

@router.get("/{team_id}", response_model=schemas.TeamWithPlayers)
async def get_team(team_id: int, db: Session = Depends(get_db)):
    """Get team details with all players"""
    team = db.query(TeamModel).filter(TeamModel.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("/", response_model=schemas.Team)
async def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    """Create a new team"""
    # Check if team name already exists
    existing_team = db.query(TeamModel).filter(TeamModel.name == team.name).first()
    if existing_team:
        raise HTTPException(status_code=400, detail="Team name already exists")
    
    db_team = TeamModel(**team.dict())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    
    return db_team

@router.get("/{team_id}/max-bid-limit")
async def get_team_max_bid_limit(team_id: int, db: Session = Depends(get_db)):
    """Get the maximum bid limit for a team"""
    team = db.query(TeamModel).filter(TeamModel.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    max_bid = calculate_max_bid_limit(team)
    players_needed = max(0, MINIMUM_PLAYERS - team.players_count)
    
    return {
        "team_id": team.id,
        "team_name": team.name,
        "remaining_budget": team.remaining_budget,
        "players_count": team.players_count,
        "min_players_required": MINIMUM_PLAYERS,
        "players_still_needed": players_needed,
        "max_bid_limit": max_bid,
        "explanation": f"Reserve {(players_needed - 1) * BASE_PLAYER_PRICE if players_needed > 0 else 0} INR for {players_needed - 1 if players_needed > 0 else 0} more players" if players_needed > 0 else "Minimum player requirement met"
    }

@router.post("/initialize")
async def initialize_teams(db: Session = Depends(get_db)):
    """Initialize 12 teams for Season 2 with correct names"""
    teams_data = [
        {"name": "Stellar Strikers", "short_name": "SS", "color_primary": "#1B998B", "color_secondary": "#F46036"},
        {"name": "Orbit Blasters", "short_name": "OB", "color_primary": "#FF6B35", "color_secondary": "#004E89"},
        {"name": "Nebula Raiders", "short_name": "NR", "color_primary": "#5F0F40", "color_secondary": "#FB8B24"},
        {"name": "Astro Warriors", "short_name": "AW", "color_primary": "#0F4C5C", "color_secondary": "#E36414"},
        {"name": "Celestial Smashers", "short_name": "CS", "color_primary": "#3A0CA3", "color_secondary": "#F72585"},
        {"name": "Cosmic Avengers", "short_name": "CA", "color_primary": "#2E4057", "color_secondary": "#048A81"},
        {"name": "Equinox Crusaders", "short_name": "EC", "color_primary": "#D62828", "color_secondary": "#F77F00"},
        {"name": "Meteor Stormers", "short_name": "MS", "color_primary": "#6A4C93", "color_secondary": "#1982C4"},
        {"name": "Supernova OG", "short_name": "SOG", "color_primary": "#CB429F", "color_secondary": "#4D5382"},
        {"name": "Lunar Legends", "short_name": "LL", "color_primary": "#06A77D", "color_secondary": "#D9138A"},
        {"name": "Quantum Blasters", "short_name": "QB", "color_primary": "#C9184A", "color_secondary": "#FFB703"},
        {"name": "Jupiter Titans", "short_name": "JT", "color_primary": "#023E8A", "color_secondary": "#90E0EF"},
    ]
    
    created_teams = []
    for team_data in teams_data:
        existing = db.query(TeamModel).filter(TeamModel.name == team_data["name"]).first()
        if not existing:
            team = TeamModel(**team_data)
            db.add(team)
            created_teams.append(team_data["name"])
    
    db.commit()
    return {"message": f"Initialized {len(created_teams)} teams", "teams": created_teams}

@router.post("/register", response_model=schemas.Team)
async def register_team(
    team_registration: schemas.TeamRegistration,
    db: Session = Depends(get_db)
):
    """Register team owner details and complete team setup"""
    # Get the team
    team = db.query(TeamModel).filter(TeamModel.id == team_registration.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if team is already registered
    if team.team_registered:
        raise HTTPException(status_code=400, detail="Team is already registered")
    
    # Update team with registration details
    team.owner_name = team_registration.owner_name
    team.owner_email = team_registration.owner_email
    team.owner_phone = team_registration.owner_phone
    team.sponsor_name = team_registration.sponsor_name
    team.sponsor_details = team_registration.sponsor_details
    team.about_us = team_registration.about_us
    if team_registration.logo_url:
        team.logo_url = team_registration.logo_url
    team.team_registered = True
    
    db.commit()
    db.refresh(team)
    
    # Manually construct response with max_bid_limit
    return {
        "id": team.id,
        "name": team.name,
        "short_name": team.short_name,
        "logo_url": team.logo_url,
        "team_logo": team.team_logo,
        "color_primary": team.color_primary,
        "color_secondary": team.color_secondary,
        "budget": team.budget,
        "remaining_budget": team.remaining_budget,
        "players_count": team.players_count,
        "max_bid_limit": calculate_max_bid_limit(team),
        "owner_name": team.owner_name,
        "owner_email": team.owner_email,
        "owner_phone": team.owner_phone,
        "sponsor_name": team.sponsor_name,
        "sponsor_details": team.sponsor_details,
        "about_us": team.about_us,
        "team_registered": team.team_registered,
        "created_at": team.created_at
    }

@router.get("/unregistered")
async def get_unregistered_teams(db: Session = Depends(get_db)):
    """Get all teams that haven't completed registration"""
    teams = db.query(TeamModel).filter(TeamModel.team_registered == False).all()
    return teams

@router.put("/{team_id}", response_model=schemas.Team)
async def update_team(
    team_id: int,
    team_update: schemas.TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update team details (Admin only)"""
    team = db.query(TeamModel).filter(TeamModel.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Update team fields
    for field, value in team_update.dict(exclude_unset=True).items():
        setattr(team, field, value)
    
    db.commit()
    db.refresh(team)
    
    return {
        "id": team.id,
        "name": team.name,
        "short_name": team.short_name,
        "logo_url": team.logo_url,
        "team_logo": team.team_logo,
        "color_primary": team.color_primary,
        "color_secondary": team.color_secondary,
        "budget": team.budget,
        "remaining_budget": team.remaining_budget,
        "players_count": team.players_count,
        "max_bid_limit": calculate_max_bid_limit(team),
        "owner_name": team.owner_name,
        "owner_email": team.owner_email,
        "owner_phone": team.owner_phone,
        "sponsor_name": team.sponsor_name,
        "sponsor_details": team.sponsor_details,
        "about_us": team.about_us,
        "team_registered": team.team_registered,
        "created_at": team.created_at
    }

@router.get("/export/excel")
async def export_teams_to_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Export all teams to Excel (Admin only)"""
    import io
    import pandas as pd
    from fastapi.responses import StreamingResponse
    
    teams = db.query(TeamModel).all()
    
    # Convert to dict
    teams_data = []
    for team in teams:
        teams_data.append({
            "ID": team.id,
            "Name": team.name,
            "Short Name": team.short_name,
            "Budget": team.budget,
            "Remaining Budget": team.remaining_budget,
            "Players Count": team.players_count,
            "Owner Name": team.owner_name,
            "Owner Email": team.owner_email,
            "Owner Phone": team.owner_phone,
            "Sponsor Name": team.sponsor_name,
            "Sponsor Details": team.sponsor_details,
            "About Us": team.about_us,
            "Team Registered": team.team_registered,
            "Color Primary": team.color_primary,
            "Color Secondary": team.color_secondary,
            "Created At": team.created_at
        })
    
    # Create DataFrame
    df = pd.DataFrame(teams_data)
    
    # Write to Excel
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Teams')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=gpl_teams.xlsx'}
    )

