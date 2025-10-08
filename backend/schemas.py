from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date
from models import PlayerRole, PlayerStatus, AuctionStatus, PaymentStatus, BattingStyle, BowlingStyle, BlockName, PaymentMode, JerseySize, UserRole

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "generic_user"  # default to generic_user

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Team Schemas
class TeamBase(BaseModel):
    name: str
    short_name: str
    logo_url: Optional[str] = None
    color_primary: Optional[str] = None
    color_secondary: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    owner_name: Optional[str] = None
    logo_url: Optional[str] = None
    team_logo: Optional[str] = None  # Base64 encoded team logo image
    color_primary: Optional[str] = None
    color_secondary: Optional[str] = None

class TeamRegistration(BaseModel):
    team_id: int
    owner_name: str
    owner_email: EmailStr
    owner_phone: Optional[str] = None
    sponsor_name: Optional[str] = None
    sponsor_details: Optional[str] = None
    about_us: Optional[str] = None
    logo_url: Optional[str] = None

class Team(TeamBase):
    id: int
    budget: float
    remaining_budget: float
    players_count: int
    max_bid_limit: float = 0.0  # Calculated field
    team_logo: Optional[str] = None  # Base64 encoded team logo
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    sponsor_name: Optional[str] = None
    sponsor_details: Optional[str] = None
    about_us: Optional[str] = None
    team_registered: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

class TeamWithPlayers(Team):
    players: List['Player'] = []

# Player Schemas
class PlayerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    age: Optional[int] = None
    date_of_birth: Optional[datetime] = None
    role: PlayerRole
    batting_style: Optional[BattingStyle] = None
    bowling_style: Optional[BowlingStyle] = None
    block_name: Optional[BlockName] = None
    flat_number: Optional[str] = None
    payment_mode: Optional[PaymentMode] = None
    amount: Optional[float] = None
    payment_transaction_number: Optional[str] = None
    payment_date: Optional[datetime] = None
    jersey_size: Optional[JerseySize] = None
    cricheroes_id: Optional[str] = None
    bio: Optional[str] = None

    @field_validator('flat_number')
    @classmethod
    def validate_flat_number(cls, v):
        if v and not v.isdigit():
            raise ValueError('Flat number must contain only digits')
        if v and len(v) != 3:
            raise ValueError('Flat number must be exactly 3 digits')
        return v
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v and v % 500 != 0:
            raise ValueError('Amount must be in multiples of 500')
        return v
    
    @field_validator('age')
    @classmethod
    def validate_age(cls, v):
        if v and (v < 0 or v > 100):
            raise ValueError('Age must be between 0 and 100')
        return v

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[PlayerRole] = None
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    player_image: Optional[str] = None
    base_price: Optional[float] = None

class Player(PlayerBase):
    id: int
    status: PlayerStatus
    matches_played: int
    runs_scored: int
    wickets_taken: int
    batting_average: float
    bowling_average: float
    strike_rate: float
    has_cricheroes_data: bool
    base_price: float
    sold_price: Optional[float] = None
    team_id: Optional[int] = None
    registration_fee_paid: bool
    photo_url: Optional[str] = None
    player_image: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class PlayerWithTeam(Player):
    team: Optional[Team] = None

# Auction Schemas
class AuctionBase(BaseModel):
    season: int = 2

class AuctionCreate(AuctionBase):
    pass

class Auction(AuctionBase):
    id: int
    status: AuctionStatus
    current_player_id: Optional[int] = None
    current_bid_amount: Optional[float] = None
    current_bidding_team_id: Optional[int] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AuctionWithDetails(Auction):
    current_player: Optional[Player] = None
    current_bidding_team: Optional[Team] = None

# Bid Schemas
class BidCreate(BaseModel):
    team_id: int
    bid_amount: float

class Bid(BaseModel):
    id: int
    auction_id: int
    player_id: int
    team_id: int
    bid_amount: float
    is_winning_bid: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class BidWithDetails(Bid):
    team: Team
    player: Player

# Payment Schemas
class PaymentCreate(BaseModel):
    player_id: int
    amount: float = 500.0

class Payment(BaseModel):
    id: int
    player_id: int
    amount: float
    currency: str
    status: PaymentStatus
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    payment_method: Optional[str] = None
    upi_transaction_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Registration Schema
class PlayerRegistration(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    age: Optional[int] = None
    date_of_birth: Optional[datetime] = None
    role: PlayerRole
    batting_style: Optional[BattingStyle] = None
    bowling_style: Optional[BowlingStyle] = None
    block_name: Optional[BlockName] = None
    flat_number: Optional[str] = None
    payment_mode: Optional[PaymentMode] = None
    amount: Optional[float] = None
    payment_transaction_number: Optional[str] = None
    payment_date: Optional[datetime] = None
    jersey_size: Optional[JerseySize] = None
    cricheroes_id: Optional[str] = None
    bio: Optional[str] = None
    player_image: Optional[str] = None  # Player registration image

    @field_validator('flat_number')
    @classmethod
    def validate_flat_number(cls, v):
        if v and not v.isdigit():
            raise ValueError('Flat number must contain only digits')
        if v and len(v) != 3:
            raise ValueError('Flat number must be exactly 3 digits')
        return v
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v and v % 500 != 0:
            raise ValueError('Amount must be in multiples of 500')
        return v
    
    @field_validator('age')
    @classmethod
    def validate_age(cls, v):
        if v and (v < 0 or v > 100):
            raise ValueError('Age must be between 0 and 100')
        return v

# WebSocket Messages
class AuctionMessage(BaseModel):
    type: str  # "bid", "player_change", "auction_status", "team_update"
    data: dict

class BidMessage(BaseModel):
    team_id: int
    team_name: str
    bid_amount: float
    player_id: int
    player_name: str
    timestamp: datetime
