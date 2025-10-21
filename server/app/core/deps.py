from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_token_flexible
from app.models.user import User, Role, UserRole
from app.models.permission import PermissionAssignment
from app.core.config import settings
import uuid
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user - supports both JWT and Azure AD tokens."""
    token = credentials.credentials

    # Try to verify token (supports both JWT and Azure AD)
    payload, token_type = verify_token_flexible(token)

    if token_type == "azure":
        # Azure AD token - find or create user
        email = payload.get("email")
        azure_id = payload.get("azure_id")
        name = payload.get("name")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not found in Azure AD token",
            )

        # Find user by email or azure_id
        user = db.query(User).filter(
            (User.email == email) | (User.azure_id == azure_id)
        ).first()

        is_new_azure_user = False
        if user is None:
            # Auto-create Azure user
            logger.info(f"Auto-creating Azure AD user: {email}")
            user = User(
                email=email,
                name=name or email.split("@")[0],
                azure_id=azure_id,
                password_hash=None,  # Azure users don't have password
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Created Azure AD user with ID: {user.id}")
            is_new_azure_user = True
        else:
            # Update azure_id if not set
            if user.azure_id is None and azure_id:
                user.azure_id = azure_id
                db.commit()
                is_new_azure_user = True
                logger.info(
                    f"Updated existing user {user.id} with Azure ID: {azure_id}")

        # Auto-assign Admin role to Azure users who successfully logged in
        if is_new_azure_user or (user.azure_id is not None):
            # Check if user already has Admin role
            existing_admin_role = db.query(UserRole).join(Role).filter(
                UserRole.user_id == user.id,
                Role.name == "Admin"
            ).first()

            if not existing_admin_role:
                # Get Admin role (id=1)
                admin_role = db.query(Role).filter(
                    Role.name == "Admin").first()
                if admin_role:
                    user_role = UserRole(
                        user_id=user.id, role_id=admin_role.id)
                    db.add(user_role)
                    db.commit()
                    logger.info(
                        f"Assigned Admin role to Azure user {user.id} ({email})")
                else:
                    logger.warning(f"Admin role not found in database")

        return user

    else:  # JWT token
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
    """Get current active user (either with password hash or Azure ID)."""
    # Azure users have azure_id but no password_hash
    # Traditional users have password_hash but no azure_id
    if current_user.password_hash is None and current_user.azure_id is None:
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
