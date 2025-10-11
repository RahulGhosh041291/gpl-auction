from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Player as PlayerModel, PlayerStatus, PlayerRole, User, Team as TeamModel, Bid
from auth import get_current_user, get_current_admin_user
import schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Player])
async def get_all_players(
    status: Optional[PlayerStatus] = None,
    role: Optional[PlayerRole] = None,
    db: Session = Depends(get_db)
):
    """Get all players with optional filters"""
    query = db.query(PlayerModel)
    
    if status:
        query = query.filter(PlayerModel.status == status)
    if role:
        query = query.filter(PlayerModel.role == role)
    
    players = query.all()
    return players

@router.get("/{player_id}", response_model=schemas.PlayerWithTeam)
async def get_player(player_id: int, db: Session = Depends(get_db)):
    """Get player details by ID"""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@router.post("/", response_model=schemas.Player)
async def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db)):
    """Create a new player (admin only)"""
    # Check if email already exists
    existing_player = db.query(PlayerModel).filter(PlayerModel.email == player.email).first()
    if existing_player:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_player = PlayerModel(**player.dict())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

@router.put("/{player_id}", response_model=schemas.Player)
async def update_player(
    player_id: int,
    player_update: schemas.PlayerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update player details (Admin only)"""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    update_data = player_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(player, field, value)
    
    db.commit()
    db.refresh(player)
    return player

@router.delete("/{player_id}")
async def delete_player(
    player_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a player (Admin only)"""
    from models import Auction
    
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if player.status == PlayerStatus.SOLD:
        raise HTTPException(status_code=400, detail="Cannot delete a sold player")
    
    # Clear any auction references to this player
    db.query(Auction).filter(Auction.current_player_id == player_id).update({
        "current_player_id": None,
        "current_bid_amount": None,
        "current_bidding_team_id": None
    })
    
    # Delete all bids associated with this player
    db.query(Bid).filter(Bid.player_id == player_id).delete()
    
    # Now delete the player
    db.delete(player)
    db.commit()
    return {"message": "Player deleted successfully"}

@router.get("/available/count")
async def get_available_players_count(db: Session = Depends(get_db)):
    """Get count of available players for auction"""
    count = db.query(PlayerModel).filter(
        PlayerModel.status == PlayerStatus.AVAILABLE,
        PlayerModel.registration_fee_paid == True
    ).count()
    return {"count": count}

@router.post("/{player_id}/mark-available")
async def mark_player_available(
    player_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Mark a player as available for auction (Admin only)
    Can mark registered, unsold, or even sold players as available for re-auction"""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if not player.registration_fee_paid:
        raise HTTPException(status_code=400, detail="Registration fee not paid")
    
    # Reset player data and credit back amount if they were previously sold
    if player.status == PlayerStatus.SOLD:
        if player.team_id and player.sold_price:
            # Get the team and credit back the amount
            team = db.query(TeamModel).filter(TeamModel.id == player.team_id).first()
            if team:
                team.remaining_budget += player.sold_price
                team.players_count = max(0, team.players_count - 1)
        
        player.team_id = None
        player.sold_price = None
    
    player.status = PlayerStatus.AVAILABLE
    db.commit()
    db.refresh(player)
    return {"message": "Player marked as available for auction", "player": player}

@router.post("/{player_id}/mark-unsold")
async def mark_sold_player_as_unsold(
    player_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Mark a SOLD player as UNSOLD and credit back the amount to team (Admin only)"""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if player.status != PlayerStatus.SOLD:
        raise HTTPException(status_code=400, detail="Player is not in SOLD status")
    
    # Credit back the sold amount to the team
    if player.team_id and player.sold_price:
        team = db.query(TeamModel).filter(TeamModel.id == player.team_id).first()
        if team:
            team.remaining_budget += player.sold_price
            team.players_count = max(0, team.players_count - 1)
            team_name = team.name
        else:
            team_name = "Unknown"
    else:
        raise HTTPException(status_code=400, detail="No team or sold price information found")
    
    # Store the credited amount for response
    credited_amount = player.sold_price
    
    # Reset player to unsold status
    player.status = PlayerStatus.UNSOLD
    player.team_id = None
    player.sold_price = None
    
    db.commit()
    db.refresh(player)
    
    return {
        "message": f"Player marked as unsold. ₹{credited_amount:,.0f} credited back to {team_name}",
        "player": player,
        "credited_amount": credited_amount,
        "team_name": team_name
    }

@router.get("/export/excel")
async def export_players_to_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Export all players to Excel (Admin only)"""
    import io
    import pandas as pd
    from fastapi.responses import StreamingResponse
    
    players = db.query(PlayerModel).all()
    
    # Convert to dict
    players_data = []
    for player in players:
        # Get team details if player is assigned to a team
        team_name = None
        team_short_name = None
        if player.team_id:
            team = db.query(TeamModel).filter(TeamModel.id == player.team_id).first()
            if team:
                team_name = team.name
                team_short_name = team.short_name
        
        players_data.append({
            "ID": player.id,
            "Name": player.name,
            "Email": player.email,
            "Phone": player.phone,
            "Age": player.age,
            "Role": player.role.value if player.role else None,
            "Status": player.status.value if player.status else None,
            "Batting Style": player.batting_style.value if player.batting_style else None,
            "Bowling Style": player.bowling_style.value if player.bowling_style else None,
            "Block Name": player.block_name.value if player.block_name else None,
            "Flat Number": player.flat_number,
            "Jersey Size": player.jersey_size.value if player.jersey_size else None,
            "Cricheroes ID": player.cricheroes_id,
            "Base Price": player.base_price,
            "Sold Price": player.sold_price,
            "Team ID": player.team_id,
            "Team Name": team_name,
            "Team Short Name": team_short_name,
            "Registration Fee Paid": player.registration_fee_paid,
            "Matches Played": player.matches_played,
            "Runs Scored": player.runs_scored,
            "Wickets Taken": player.wickets_taken,
            "Batting Average": player.batting_average,
            "Strike Rate": player.strike_rate,
            "Created At": player.created_at
        })
    
    # Create DataFrame
    df = pd.DataFrame(players_data)
    
    # Write to Excel
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Players')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=gpl_players.xlsx'}
    )

