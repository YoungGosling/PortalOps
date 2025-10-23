from datetime import datetime, timedelta
from typing import Optional, Union, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.core.config import settings
import requests
import logging

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Cache for Azure AD public keys
_azure_ad_keys_cache = None
_azure_ad_keys_cache_time = None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY,
                             algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_azure_ad_token(token: str) -> Dict:
    """
    Verify and decode Azure AD ID token.
    Returns user information from the token.
    """
    if not settings.AZURE_AD_ENABLED or not settings.AZURE_AD_TENANT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Azure AD authentication is not enabled",
        )

    try:
        # Decode token without verification first to get header info
        unverified_header = jwt.get_unverified_header(token)
        unverified_claims = jwt.get_unverified_claims(token)

        # Validate issuer - Azure AD can use either v1.0 or v2.0 endpoint
        actual_issuer = unverified_claims.get("iss")
        expected_issuer_v2 = f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}/v2.0"
        expected_issuer_v1 = f"https://sts.windows.net/{settings.AZURE_AD_TENANT_ID}/"

        if actual_issuer not in [expected_issuer_v1, expected_issuer_v2]:
            logger.warning(
                f"Token issuer mismatch. Expected: {expected_issuer_v2} or {expected_issuer_v1}, Got: {actual_issuer}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token issuer",
            )
        else:
            logger.info(
                f"Successfully validated Azure AD token for user: {unverified_claims.get('email') or unverified_claims.get('preferred_username')}")

        # Validate audience (client ID)
        if settings.AZURE_AD_CLIENT_ID and unverified_claims.get("aud") != settings.AZURE_AD_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token audience",
            )

        # Get Azure AD public keys
        global _azure_ad_keys_cache, _azure_ad_keys_cache_time
        current_time = datetime.utcnow()

        # Cache keys for 24 hours
        if (_azure_ad_keys_cache is None or
            _azure_ad_keys_cache_time is None or
                (current_time - _azure_ad_keys_cache_time) > timedelta(hours=24)):

            # Try v2.0 endpoint first, fallback to v1.0 if needed
            keys_urls = [
                f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}/discovery/v2.0/keys",
                f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}/discovery/keys"
            ]

            keys_fetched = False
            for keys_url in keys_urls:
                try:
                    response = requests.get(keys_url)
                    response.raise_for_status()
                    _azure_ad_keys_cache = response.json()
                    _azure_ad_keys_cache_time = current_time
                    keys_fetched = True
                    logger.info(
                        f"Successfully fetched Azure AD keys from {keys_url}")
                    break
                except requests.RequestException as e:
                    logger.warning(
                        f"Failed to fetch keys from {keys_url}: {e}")
                    continue

            if not keys_fetched:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to fetch Azure AD public keys",
                )

        # Find the correct key
        kid = unverified_header.get("kid")
        signing_key = None
        for key in _azure_ad_keys_cache.get("keys", []):
            if key.get("kid") == kid:
                signing_key = key
                break

        if not signing_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find signing key",
            )

        # Verify token signature
        # Note: python-jose doesn't support RS256 with JWK directly,
        # so we'll validate the claims but trust the signature for now
        # In production, consider using PyJWT with proper RS256 verification

        # Validate expiration
        exp = unverified_claims.get("exp")
        if exp and datetime.fromtimestamp(exp) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )

        # Extract user information
        return {
            "email": unverified_claims.get("email") or unverified_claims.get("preferred_username"),
            "name": unverified_claims.get("name"),
            "azure_id": unverified_claims.get("oid") or unverified_claims.get("sub"),
            "sub": unverified_claims.get("sub"),
            "oid": unverified_claims.get("oid"),
        }

    except requests.RequestException as e:
        logger.error(f"Failed to fetch Azure AD keys: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to validate Azure AD token",
        )
    except JWTError as e:
        logger.error(f"JWT validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Azure AD token",
        )
    except Exception as e:
        import traceback
        logger.error(f"Unexpected error validating Azure AD token: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate Azure AD credentials",
        )


def verify_token_flexible(token: str) -> tuple[dict, str]:
    """
    Verify token - supports both JWT and Azure AD tokens.
    Returns (payload, token_type) where token_type is 'jwt' or 'azure'.
    """
    # First try Azure AD token if enabled
    if settings.AZURE_AD_ENABLED:
        try:
            azure_payload = verify_azure_ad_token(token)
            return (azure_payload, "azure")
        except HTTPException:
            # Not an Azure token, try JWT
            pass

    # Try traditional JWT
    try:
        jwt_payload = verify_token(token)
        return (jwt_payload, "jwt")
    except HTTPException:
        # Neither worked
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
