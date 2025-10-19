from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_token
from app.models.user import User, Role, UserRole
from app.models.permission import PermissionAssignment
from app.core.config import settings
import uuid

security = HTTPBearer()


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user."""
    token = credentials.credentials
    payload = verify_token(token)

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
        )

    user = db.query(User).filter(User.id == user_uuid).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user (with password hash, meaning they can login)."""
    if current_user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is not activated for login",
        )
    return current_user


def require_admin(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """Require Admin role."""
    user_roles = db.query(Role.name).join(UserRole).filter(
        UserRole.user_id == current_user.id).all()
    role_names = [role.name for role in user_roles]

    if "Admin" not in role_names:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


def require_service_admin_or_higher(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """Require ServiceAdmin or Admin role (v2 - simplified)."""
    user_roles = db.query(Role.name).join(UserRole).filter(
        UserRole.user_id == current_user.id).all()
    role_names = [role.name for role in user_roles]

    if not any(role in role_names for role in ["Admin", "ServiceAdmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Service Administrator or Admin access required",
        )

    return current_user


def require_any_admin_role(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """Require any admin role (Admin or ServiceAdmin) - v2 simplified."""
    user_roles = db.query(Role.name).join(UserRole).filter(
        UserRole.user_id == current_user.id).all()
    role_names = [role.name for role in user_roles]

    if not any(role in role_names for role in ["Admin", "ServiceAdmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )

    return current_user


def verify_hr_webhook_key(x_api_key: Optional[str] = Header(None)) -> bool:
    """Verify HR webhook API key."""
    if x_api_key != settings.HR_WEBHOOK_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    return True


def get_user_permissions(user_id: uuid.UUID, db: Session) -> dict:
    """Get user's service and product permissions."""
    permissions = db.query(PermissionAssignment).filter(
        PermissionAssignment.user_id == user_id
    ).all()

    services = []
    products = []

    for perm in permissions:
        if perm.service_id:
            services.append(str(perm.service_id))
        if perm.product_id:
            products.append(str(perm.product_id))

    return {
        "services": services,
        "products": products
    }


def get_user_roles(user_id: uuid.UUID, db: Session) -> list:
    """Get user's role names."""
    user_roles = db.query(Role.name).join(
        UserRole).filter(UserRole.user_id == user_id).all()
    return [role.name for role in user_roles]
