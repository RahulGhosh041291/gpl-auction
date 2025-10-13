from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    GENERIC_USER = "generic_user"

class PlayerRole(str, enum.Enum):
    BATSMAN = "batsman"
    BOWLER = "bowler"
    ALL_ROUNDER = "all_rounder"
    LEFT_HANDED = "left_handed"

class BattingStyle(str, enum.Enum):
    LEFT_HANDED = "left_handed"
    RIGHT_HANDED = "right_handed"

class BowlingStyle(str, enum.Enum):
    LEFT_HANDED = "left_handed"
    RIGHT_HANDED = "right_handed"

class BlockName(str, enum.Enum):
    OPHELIA = "Ophelia"
    BIANCA = "Bianca"
    ORION = "Orion"
    CYGNUS = "Cygnus"
    PHOENIX = "Phoenix"
    MYNSA = "Mynsa"
    EUROPA = "Europa"
    ATLAS = "Atlas"
    CAPELLA = "Capella"

class PaymentMode(str, enum.Enum):
    UPI = "UPI"
    NET_BANKING = "Net Banking"
    CASH = "Cash"

class JerseySize(str, enum.Enum):
    XS = "XS"
    S = "S"
    M = "M"
    L = "L"
    XL = "XL"
    XXL = "XXL"
    XXXL = "XXXL"

class PlayerStatus(str, enum.Enum):
    REGISTERED = "registered"
    AVAILABLE = "available"
    SOLD = "sold"
    UNSOLD = "unsold"

class AuctionStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    short_name = Column(String(3), unique=True, nullable=False)
    logo_url = Column(String, nullable=True)
    team_logo = Column(Text, nullable=True)  # Base64 encoded team logo
    color_primary = Column(String, nullable=True)
    color_secondary = Column(String, nullable=True)
    budget = Column(Float, default=500000.0)  # 5 lakhs INR
    remaining_budget = Column(Float, default=500000.0)
    players_count = Column(Integer, default=0)
    
    # Team registration details
    owner_name = Column(String, nullable=True)
    owner_email = Column(String, nullable=True)
    owner_phone = Column(String, nullable=True)
    sponsor_name = Column(String, nullable=True)
    sponsor_details = Column(Text, nullable=True)
    about_us = Column(Text, nullable=True)
    team_registered = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    players = relationship("Player", back_populates="team")
    bids = relationship("Bid", back_populates="team")

class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(Enum(PlayerRole), nullable=False)
    status = Column(Enum(PlayerStatus), default=PlayerStatus.REGISTERED)
    
    # Cricket stats
    batting_style = Column(Enum(BattingStyle), nullable=True)
    bowling_style = Column(Enum(BowlingStyle), nullable=True)
    matches_played = Column(Integer, default=0)
    runs_scored = Column(Integer, default=0)
    wickets_taken = Column(Integer, default=0)
    batting_average = Column(Float, default=0.0)
    bowling_average = Column(Float, default=0.0)
    strike_rate = Column(Float, default=0.0)
    
    # Residential details
    block_name = Column(Enum(BlockName), nullable=True)
    flat_number = Column(String, nullable=True)  # Digits only, no length restriction
    
    # Payment details
    payment_mode = Column(Enum(PaymentMode), nullable=True)
    amount = Column(Float, nullable=True)  # Multiples of 500
    payment_transaction_number = Column(String, nullable=True)
    payment_date = Column(DateTime, nullable=True)
    
    # Jersey details
    jersey_size = Column(Enum(JerseySize), nullable=True)
    
    # Cricheroes data
    cricheroes_id = Column(String, nullable=True)
    has_cricheroes_data = Column(Boolean, default=False)
    
    # Auction details
    base_price = Column(Float, default=10000.0)  # 10,000 INR
    sold_price = Column(Float, nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    # Registration
    registration_fee_paid = Column(Boolean, default=False)
    payment_id = Column(String, nullable=True)
    
    # Profile
    photo_url = Column(String, nullable=True)
    player_image = Column(String, nullable=True)  # Player registration image
    bio = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    team = relationship("Team", back_populates="players")
    bids = relationship("Bid", back_populates="player")
    payment = relationship("Payment", back_populates="player", uselist=False)

class Auction(Base):
    __tablename__ = "auctions"
    
    id = Column(Integer, primary_key=True, index=True)
    season = Column(Integer, default=2)
    status = Column(Enum(AuctionStatus), default=AuctionStatus.NOT_STARTED)
    current_player_id = Column(Integer, ForeignKey("players.id"), nullable=True)
    current_bid_amount = Column(Float, nullable=True)
    current_bidding_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    bids = relationship("Bid", back_populates="auction")

class Bid(Base):
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    bid_amount = Column(Float, nullable=False)
    is_winning_bid = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    auction = relationship("Auction", back_populates="bids")
    player = relationship("Player", back_populates="bids")
    team = relationship("Team", back_populates="bids")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    amount = Column(Float, default=500.0)  # 500 INR registration fee
    currency = Column(String, default="INR")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Razorpay payment details
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    
    # UPI details
    payment_method = Column(String, nullable=True)  # upi, card, netbanking, etc.
    upi_transaction_id = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    player = relationship("Player", back_populates="payment")

class OwnerRegistration(Base):
    __tablename__ = "owner_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_full_name = Column(String, nullable=False)
    co_owner_full_name = Column(String, nullable=True)
    owner_block = Column(Enum(BlockName), nullable=False)
    owner_unit_number = Column(String, nullable=False)
    co_owner_block = Column(Enum(BlockName), nullable=True)
    co_owner_unit_number = Column(String, nullable=True)
    interested_to_buy = Column(Boolean, nullable=False, default=False)
    team_price = Column(Float, default=15000.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
