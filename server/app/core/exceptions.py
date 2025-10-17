from fastapi import HTTPException, status


class PortalOpsException(Exception):
    """Base exception for PortalOps application."""
    pass


class AuthenticationError(PortalOpsException):
    """Authentication related errors."""
    pass


class AuthorizationError(PortalOpsException):
    """Authorization related errors."""
    pass


class ValidationError(PortalOpsException):
    """Data validation errors."""
    pass


class NotFoundError(PortalOpsException):
    """Resource not found errors."""
    pass


class ConflictError(PortalOpsException):
    """Resource conflict errors."""
    pass


# HTTP Exception helpers
def http_404(detail: str = "Resource not found"):
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def http_400(detail: str = "Bad request"):
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def http_401(detail: str = "Authentication required"):
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def http_403(detail: str = "Access forbidden"):
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def http_409(detail: str = "Resource conflict"):
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


def http_422(detail: str = "Validation error"):
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)



