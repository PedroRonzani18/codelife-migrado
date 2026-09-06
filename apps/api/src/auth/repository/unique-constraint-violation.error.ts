export class UniqueConstraintViolationError extends Error {
  constructor() {
    super('Persistence unique constraint conflict');
    this.name = 'UniqueConstraintViolationError';
  }
}
