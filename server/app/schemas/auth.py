from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    accessToken: str
    user: dict


class TokenData(BaseModel):
    user_id: Optional[str] = None



