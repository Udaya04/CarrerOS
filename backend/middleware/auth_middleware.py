import os
from typing import Optional
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.services.auth_service import AuthException, AuthService, get_supabase_client
from backend.models.user_model import UserProfile

security = HTTPBearer(auto_error=False)
auth_service = AuthService()

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> UserProfile:
    if not credentials:
        raise AuthException("Token missing", 401)
    token = credentials.credentials

    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise AuthException("Invalid credentials", 401)

        user_id = user_response.user.id

    except Exception as e:
        error_msg = str(e).lower()
        if "expired" in error_msg:
            raise AuthException("Token expired", 401)
        raise AuthException("Invalid credentials", 401)

    try:
        user_profile = auth_service.get_profile_by_id(user_id)
        return user_profile
    except Exception as e:
        raise AuthException("Invalid credentials", 401)