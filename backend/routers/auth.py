from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from database import get_db
from models import User, UserRole
from schemas import Token, UserLogin, UserResponse, UserCreate
from auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_current_admin_user,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    init_default_users
)

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """
    Login endpoint - authenticates user and returns JWT token.
    
    **Users:**
    - Username: Admin, Password: Admin123*#
    - Username: GenericUser, Password: User123#
    """
    user = authenticate_user(db, user_login.username, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role.value
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }

@router.post("/users", response_model=UserResponse)
async def create_user(
    user_create: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create a new user (Admin only).
    """
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_create.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Create new user
    new_user = User(
        username=user_create.username,
        hashed_password=get_password_hash(user_create.password),
        role=UserRole(user_create.role),
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "username": new_user.username,
        "role": new_user.role.value,
        "is_active": new_user.is_active,
        "created_at": new_user.created_at,
        "last_login": new_user.last_login
    }

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all users (Admin only).
    """
    users = db.query(User).all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
        for user in users
    ]

@router.post("/init-users")
async def initialize_users(db: Session = Depends(get_db)):
    """
    Initialize default users (Admin and GenericUser).
    This endpoint can be called without authentication.
    """
    users_created = init_default_users(db)
    
    if users_created:
        return {
            "message": "Default users initialized successfully",
            "users_created": users_created,
            "credentials": {
                "Admin": {"username": "Admin", "password": "Admin123*#", "role": "admin"},
                "GenericUser": {"username": "GenericUser", "password": "User123#", "role": "generic_user"}
            }
        }
    else:
        return {
            "message": "Default users already exist",
            "credentials": {
                "Admin": {"username": "Admin", "password": "Admin123*#", "role": "admin"},
                "GenericUser": {"username": "GenericUser", "password": "User123#", "role": "generic_user"}
            }
        }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a user (Admin only).
    Admins cannot delete themselves.
    """
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}
