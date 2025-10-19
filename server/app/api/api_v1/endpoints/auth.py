from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import user
from app.core.security import create_access_token
from app.core.config import settings
from app.core.deps import get_current_active_user, get_user_permissions, get_user_roles
from app.schemas.auth import Token, LoginRequest
from app.models.user import User

router = APIRouter()


@router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    authenticated_user = user.authenticate(
        db, email=login_data.email, password=login_data.password
    )
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(authenticated_user.id)}, expires_delta=access_token_expires
    )

    return {
        "accessToken": access_token,
        "user": {
            "id": str(authenticated_user.id),
            "name": authenticated_user.name,
            "email": authenticated_user.email
        }
    }


@router.get("/me")
def read_users_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current user profile with roles and assigned services (v2).
    """
    user_roles = get_user_roles(current_user.id, db)
    user_permissions = get_user_permissions(current_user.id, db)

    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "roles": user_roles,
        "assignedServiceIds": user_permissions["services"]
    }
