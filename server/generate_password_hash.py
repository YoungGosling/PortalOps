#!/usr/bin/env python3
"""
Generate bcrypt password hash for 'password'
"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "password"
hashed = pwd_context.hash(password)

print(f"Password: {password}")
print(f"Hash: {hashed}")
print()
print("SQL Update:")
print(
    f"UPDATE users SET password_hash = '{hashed}' WHERE email IN ('admin@portalops.com', 'service.admin@portalops.com', 'product.admin@portalops.com');")



