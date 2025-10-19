from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict
from database import get_db
from models import (
    Auction as AuctionModel, 
    Bid as BidModel, 
    Player as PlayerModel, 
    Team as TeamModel,
    AuctionStatus, 
    PlayerStatus,
    User
)
from auth import get_current_admin_user
import schemas
from datetime import datetime
import json
import random

router = APIRouter()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

def calculate_max_bid_limit(team: TeamModel, db: Session) -> float:
    """Calculate maximum bid limit for a team"""
    MINIMUM_PLAYERS = 10
    BASE_PLAYER_PRICE = 10000
    
    players_still_needed = MINIMUM_PLAYERS - team.players_count
    if players_still_needed <= 0:
        return team.remaining_budget
    else:
        reserved_amount = (players_still_needed - 1) * BASE_PLAYER_PRICE
        max_bid = team.remaining_budget - reserved_amount
        return max(max_bid, BASE_PLAYER_PRICE)

@router.get("/current")
async def get_current_auction(db: Session = Depends(get_db)):
    """Get current active auction"""
    auction = db.query(AuctionModel).filter(
        AuctionModel.status.in_([AuctionStatus.IN_PROGRESS, AuctionStatus.PAUSED])
    ).first()
    
    if not auction:
        raise HTTPException(status_code=404, detail="No active auction found")
    
    # Get current player details
    current_player = None
    if auction.current_player_id:
        current_player = db.query(PlayerModel).filter(PlayerModel.id == auction.current_player_id).first()
    
    # Get current bidding team details  
    current_bidding_team = None
    if auction.current_bidding_team_id:
        current_bidding_team = db.query(TeamModel).filter(TeamModel.id == auction.current_bidding_team_id).first()
    
    return {
        "id": auction.id,
        "season": auction.season,
        "status": auction.status,
        "current_player_id": auction.current_player_id,
        "current_bid_amount": auction.current_bid_amount,
        "current_bidding_team_id": auction.current_bidding_team_id,
        "started_at": auction.started_at,
        "ended_at": auction.ended_at,
        "created_at": auction.created_at,
        "current_player": current_player,
        "current_bidding_team": current_bidding_team
    }

@router.post("/start")
async def start_auction(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Start a new auction (Admin only)"""
    # Check if there's already an active auction
    active_auction = db.query(AuctionModel).filter(
        AuctionModel.status.in_([AuctionStatus.IN_PROGRESS, AuctionStatus.PAUSED])
    ).first()
    
    if active_auction:
        raise HTTPException(status_code=400, detail="An auction is already in progress")
    
    # Get all available players ordered by auction_order (nulls last), then by id
    available_players = db.query(PlayerModel).filter(
        PlayerModel.status == PlayerStatus.AVAILABLE,
        PlayerModel.registration_fee_paid == True
    ).order_by(
        PlayerModel.auction_order.asc().nulls_last(),
        PlayerModel.id.asc()
    ).all()
    
    if not available_players:
        raise HTTPException(status_code=400, detail="No players available for auction")
    
    # Get the first player from ordered list
    first_player = available_players[0]
    
    # Create new auction
    auction = AuctionModel(
        season=2,
        status=AuctionStatus.IN_PROGRESS,
        current_player_id=first_player.id,
        current_bid_amount=first_player.base_price,
        started_at=datetime.utcnow()
    )
    db.add(auction)
    db.commit()
    db.refresh(auction)
    
    # Broadcast auction start
    await manager.broadcast({
        "type": "auction_started",
        "data": {
            "auction_id": auction.id,
            "player": {
                "id": first_player.id,
                "name": first_player.name,
                "role": first_player.role,
                "base_price": first_player.base_price
            }
        }
    })
    
    return {"message": "Auction started", "auction_id": auction.id}

@router.post("/bid")
async def place_bid(bid: schemas.BidCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Place a bid on the current player (Admin only)"""
    # Get current auction
    auction = db.query(AuctionModel).filter(
        AuctionModel.status == AuctionStatus.IN_PROGRESS
    ).first()
    
    if not auction:
        raise HTTPException(status_code=400, detail="No active auction")
    
    # Get team
    team = db.query(TeamModel).filter(TeamModel.id == bid.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Calculate max bid limit
    max_bid = calculate_max_bid_limit(team, db)
    
    # Validate bid amount
    if bid.bid_amount < auction.current_bid_amount + 5000:
        raise HTTPException(
            status_code=400, 
            detail=f"Bid must be at least {auction.current_bid_amount + 5000} INR"
        )
    
    if bid.bid_amount > max_bid:
        raise HTTPException(
            status_code=400, 
            detail=f"Bid exceeds maximum limit of {max_bid} INR. You need to reserve money for {10 - team.players_count} more players."
        )
    
    if bid.bid_amount > team.remaining_budget:
        raise HTTPException(status_code=400, detail="Insufficient budget")
    
    # Create bid record
    db_bid = BidModel(
        auction_id=auction.id,
        player_id=auction.current_player_id,
        team_id=bid.team_id,
        bid_amount=bid.bid_amount
    )
    db.add(db_bid)
    
    # Update auction
    auction.current_bid_amount = bid.bid_amount
    auction.current_bidding_team_id = bid.team_id
    
    db.commit()
    db.refresh(db_bid)
    
    # Get player details
    player = db.query(PlayerModel).filter(PlayerModel.id == auction.current_player_id).first()
    
    # Broadcast bid
    await manager.broadcast({
        "type": "new_bid",
        "data": {
            "bid_id": db_bid.id,
            "team_id": team.id,
            "team_name": team.name,
            "team_color": team.color_primary,
            "bid_amount": bid.bid_amount,
            "player_id": player.id,
            "player_name": player.name,
            "timestamp": db_bid.created_at.isoformat()
        }
    })
    
    return {"message": "Bid placed successfully", "bid_id": db_bid.id}

@router.post("/sold")
async def mark_player_sold(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Mark current player as sold and move to next player (Admin only)"""
    auction = db.query(AuctionModel).filter(
        AuctionModel.status == AuctionStatus.IN_PROGRESS
    ).first()
    
    if not auction:
        raise HTTPException(status_code=400, detail="No active auction")
    
    if not auction.current_bidding_team_id:
        raise HTTPException(status_code=400, detail="No bids placed for this player")
    
    # Get current player and team
    player = db.query(PlayerModel).filter(PlayerModel.id == auction.current_player_id).first()
    team = db.query(TeamModel).filter(TeamModel.id == auction.current_bidding_team_id).first()
    
    # Mark winning bid
    winning_bid = db.query(BidModel).filter(
        BidModel.auction_id == auction.id,
        BidModel.player_id == player.id,
        BidModel.team_id == team.id,
        BidModel.bid_amount == auction.current_bid_amount
    ).first()
    
    if winning_bid:
        winning_bid.is_winning_bid = True
    
    # Update player
    player.status = PlayerStatus.SOLD
    player.sold_price = auction.current_bid_amount
    player.team_id = team.id
    
    # Update team
    team.remaining_budget -= auction.current_bid_amount
    team.players_count += 1
    
    db.commit()
    
    # Get next player ordered by auction_order (nulls last), then by id
    next_player = db.query(PlayerModel).filter(
        PlayerModel.status == PlayerStatus.AVAILABLE,
        PlayerModel.registration_fee_paid == True
    ).order_by(
        PlayerModel.auction_order.asc().nulls_last(),
        PlayerModel.id.asc()
    ).first()
    
    # Broadcast player sold
    await manager.broadcast({
        "type": "player_sold",
        "data": {
            "player_id": player.id,
            "player_name": player.name,
            "team_id": team.id,
            "team_name": team.name,
            "sold_price": auction.current_bid_amount
        }
    })
    
    if next_player:
        # Move to next player
        auction.current_player_id = next_player.id
        auction.current_bid_amount = next_player.base_price
        auction.current_bidding_team_id = None
        db.commit()
        
        # Broadcast next player
        await manager.broadcast({
            "type": "next_player",
            "data": {
                "player": {
                    "id": next_player.id,
                    "name": next_player.name,
                    "role": next_player.role,
                    "base_price": next_player.base_price,
                    "has_cricheroes_data": next_player.has_cricheroes_data
                }
            }
        })
        
        return {"message": "Player sold, moved to next player", "next_player_id": next_player.id}
    else:
        # No more players, end auction
        auction.status = AuctionStatus.COMPLETED
        auction.ended_at = datetime.utcnow()
        db.commit()
        
        await manager.broadcast({
            "type": "auction_completed",
            "data": {"message": "All players have been auctioned"}
        })
        
        return {"message": "Auction completed"}

@router.post("/unsold")
async def mark_player_unsold(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Mark current player as unsold and move to next player (Admin only)"""
    auction = db.query(AuctionModel).filter(
        AuctionModel.status == AuctionStatus.IN_PROGRESS
    ).first()
    
    if not auction:
        raise HTTPException(status_code=400, detail="No active auction")
    
    # Update player status
    player = db.query(PlayerModel).filter(PlayerModel.id == auction.current_player_id).first()
    player.status = PlayerStatus.UNSOLD
    
    # Get next available player (excluding current and other unsold) ordered by auction_order
    # Only get AVAILABLE players, not UNSOLD ones to avoid re-auctioning unsold players
    available_players = db.query(PlayerModel).filter(
        PlayerModel.status == PlayerStatus.AVAILABLE,
        PlayerModel.registration_fee_paid == True,
        PlayerModel.id != player.id
    ).order_by(
        PlayerModel.auction_order.asc().nulls_last(),
        PlayerModel.id.asc()
    ).all()
    
    # Broadcast player unsold
    await manager.broadcast({
        "type": "player_unsold",
        "data": {
            "player_id": player.id,
            "player_name": player.name
        }
    })
    
    if available_players:
        # Get the first player from ordered list
        next_player = available_players[0]
        
        auction.current_player_id = next_player.id
        auction.current_bid_amount = next_player.base_price
        auction.current_bidding_team_id = None
        db.commit()
        
        await manager.broadcast({
            "type": "next_player",
            "data": {
                "player": {
                    "id": next_player.id,
                    "name": next_player.name,
                    "role": next_player.role,
                    "base_price": next_player.base_price
                }
            }
        })
        
        return {"message": "Player marked unsold, moved to next player"}
    else:
        auction.status = AuctionStatus.COMPLETED
        auction.ended_at = datetime.utcnow()
        db.commit()
        
        await manager.broadcast({
            "type": "auction_completed",
            "data": {"message": "All players have been auctioned"}
        })
        
        return {"message": "Auction completed"}

@router.post("/next-random")
async def get_random_next_player(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Choose a random player for auction instead of sequential (Admin only)"""
    auction = db.query(AuctionModel).filter(
        AuctionModel.status == AuctionStatus.IN_PROGRESS
    ).first()
    
    if not auction:
        raise HTTPException(status_code=400, detail="No active auction")
    
    # Get all available players (including unsold)
    available_players = db.query(PlayerModel).filter(
        PlayerModel.status.in_([PlayerStatus.AVAILABLE, PlayerStatus.UNSOLD]),
        PlayerModel.registration_fee_paid == True,
        PlayerModel.id != auction.current_player_id  # Exclude current player
    ).all()
    
    if not available_players:
        raise HTTPException(status_code=400, detail="No more players available")
    
    # Choose random player
    next_player = random.choice(available_players)
    
    # Update auction
    auction.current_player_id = next_player.id
    auction.current_bid_amount = next_player.base_price
    auction.current_bidding_team_id = None
    db.commit()
    
    # Broadcast next player
    await manager.broadcast({
        "type": "next_player",
        "data": {
            "player": {
                "id": next_player.id,
                "name": next_player.name,
                "role": next_player.role,
                "base_price": next_player.base_price,
                "has_cricheroes_data": next_player.has_cricheroes_data
            }
        }
    })
    
    return {
        "message": "Random player selected",
        "player": {
            "id": next_player.id,
            "name": next_player.name,
            "role": next_player.role,
            "base_price": next_player.base_price
        }
    }

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time auction updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back or handle specific messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/history/{player_id}", response_model=List[schemas.BidWithDetails])
async def get_player_bid_history(player_id: int, db: Session = Depends(get_db)):
    """Get all bids for a specific player"""
    bids = db.query(BidModel).filter(BidModel.player_id == player_id).all()
    return bids

@router.put("/edit-last-bid")
async def edit_last_bid(
    team_id: int,
    bid_amount: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Edit the last bid in case of manual entry mistake (Admin only)"""
    auction = db.query(AuctionModel).filter(
        AuctionModel.status == AuctionStatus.IN_PROGRESS
    ).first()
    
    if not auction:
        raise HTTPException(status_code=400, detail="No active auction")
    
    if not auction.current_player_id:
        raise HTTPException(status_code=400, detail="No player currently on auction")
    
    # Get the team
    team = db.query(TeamModel).filter(TeamModel.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get current player
    player = db.query(PlayerModel).filter(PlayerModel.id == auction.current_player_id).first()
    
    # Validate bid amount
    if bid_amount < player.base_price:
        raise HTTPException(status_code=400, detail=f"Bid amount must be at least base price: ₹{player.base_price}")
    
    # Calculate and check max bid limit
    max_bid_limit = calculate_max_bid_limit(team, db)
    if bid_amount > max_bid_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Bid exceeds team's maximum bid limit of ₹{max_bid_limit}"
        )
    
    # Update current bid in auction
    auction.current_bid_amount = bid_amount
    auction.current_bidding_team_id = team_id
    db.commit()
    
    # Broadcast the updated bid
    await manager.broadcast({
        "type": "bid_updated",
        "data": {
            "player_id": player.id,
            "player_name": player.name,
            "team_id": team.id,
            "team_name": team.name,
            "bid_amount": bid_amount
        }
    })
    
    return {
        "message": "Bid updated successfully",
        "player_name": player.name,
        "team_name": team.name,
        "bid_amount": bid_amount
    }

@router.post("/reset")
async def reset_auction(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Master reset for the auction (Admin only).
    - Marks all players as AVAILABLE
    - Resets team purses to 5 lakh (500000)
    - Clears all player-team assignments
    - Resets auction status
    """
    try:
        # 1. Reset all players
        all_players = db.query(PlayerModel).all()
        reset_count = 0
        
        for player in all_players:
            player.status = PlayerStatus.AVAILABLE
            player.team_id = None
            player.sold_price = None
            reset_count += 1
        
        # 2. Reset all teams
        all_teams = db.query(TeamModel).all()
        team_count = 0
        
        for team in all_teams:
            team.remaining_budget = 500000  # 5 lakh
            team.players_count = 0
            team_count += 1
        
        # 3. Reset auction status
        active_auction = db.query(AuctionModel).filter(
            AuctionModel.status == AuctionStatus.IN_PROGRESS
        ).first()
        
        if active_auction:
            active_auction.status = AuctionStatus.COMPLETED
            active_auction.current_player_id = None
            active_auction.current_bid_amount = None
            active_auction.current_bidding_team_id = None
        
        # 4. Clear all bids (optional - you can keep history)
        # db.query(BidModel).delete()
        
        db.commit()
        
        # 5. Broadcast reset notification
        await manager.broadcast({
            "type": "auction_reset",
            "data": {
                "message": "Auction has been reset",
                "players_reset": reset_count,
                "teams_reset": team_count
            }
        })
        
        return {
            "message": "Auction reset successfully",
            "details": {
                "players_reset": reset_count,
                "teams_reset": team_count,
                "team_purse_reset_to": "₹5,00,000"
            }
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reset auction: {str(e)}")

@router.post("/set-auction-order")
async def set_auction_order(
    player_orders: List[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Set custom auction order for players (Admin only)
    Expected format: [{"player_id": 1, "order": 1}, {"player_id": 2, "order": 2}, ...]
    """
    try:
        updated_count = 0
        for item in player_orders:
            player_id = item.get("player_id")
            order = item.get("order")
            
            if player_id is None or order is None:
                continue
                
            player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
            if player:
                player.auction_order = order
                updated_count += 1
        
        db.commit()
        
        return {
            "message": f"Auction order updated for {updated_count} players",
            "updated_count": updated_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to set auction order: {str(e)}")
