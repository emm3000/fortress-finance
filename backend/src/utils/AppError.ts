/**
 * Custom application error class with an associated HTTP status code.
 * Use this instead of plain `Error` to propagate semantic HTTP error codes
 * through the errorHandler middleware.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
    // Restore prototype chain (needed when extending built-ins in TypeScript)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
