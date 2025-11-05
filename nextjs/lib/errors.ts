/**
 * Custom error classes for the application
 */

/**
 * Error thrown when authentication fails (401 Unauthorized)
 * This indicates the user's token has expired or is invalid
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnauthorizedError);
    }
  }
}









