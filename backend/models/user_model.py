from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Any, Optional
from datetime import datetime

class UserSignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    college: Optional[str] = None
    target_role: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    college: Optional[str] = None
    target_role: Optional[str] = None
    skill_scores: Dict[str, int] = Field(default_factory=lambda: {"OS": 0, "DBMS": 0, "CN": 0, "OOP": 0})
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    college: Optional[str] = None
    target_role: Optional[str] = None
    avatar_url: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: UserProfile
