from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from backend.models.user_model import (
    UserSignUpRequest,
    UserLoginRequest,
    UserProfile,
    UserProfileUpdate,
    ChangePasswordRequest,
    AuthResponse,
)
from backend.services.auth_service import AuthService
from backend.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()
limiter = Limiter(key_func=get_remote_address)

@router.post("/signup", response_model=AuthResponse)
@limiter.limit("3/minute")
async def signup(request: Request, body: UserSignUpRequest):
    result = auth_service.sign_up(body)
    return result

@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login(request: Request, body: UserLoginRequest):
    result = auth_service.login(body)
    return result

@router.get("/me", response_model=UserProfile)
async def me(current_user: UserProfile = Depends(get_current_user)):
    return current_user

@router.patch("/profile", response_model=UserProfile)
async def update_profile(
    body: UserProfileUpdate,
    current_user: UserProfile = Depends(get_current_user),
):
    result = auth_service.update_profile(current_user.id, body.model_dump())
    return result

@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    auth_service.change_password(
        current_user.id, current_user.email, body.current_password, body.new_password
    )
    return {"message": "Password changed successfully"}
