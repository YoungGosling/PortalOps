import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  exp?: number;
  sub?: string;
  [key: string]: any;
}

/**
 * Verify if a JWT token is valid and not expired
 * @param token - The JWT token to verify
 * @returns true if the token is valid and not expired, false otherwise
 */
export function isTokenValid(token: string | undefined | null): boolean {
  if (!token) {
    return false;
  }

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    
    // Check if token has expiration claim
    if (!decoded.exp) {
      // If no expiration, consider it invalid for security
      return false;
    }

    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    // Invalid token format
    console.error('Failed to decode JWT token:', error);
    return false;
  }
}

/**
 * Get the expiration time of a JWT token
 * @param token - The JWT token
 * @returns The expiration time in seconds, or null if invalid
 */
export function getTokenExpiration(token: string | undefined | null): number | null {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return decoded.exp || null;
  } catch (error) {
    return null;
  }
}

