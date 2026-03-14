export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class CardKnownError extends AppError {
  constructor() {
    super('CARD_KNOWN', 'Cannot rate a known card', 409)
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super('NOT_FOUND', `${entity} not found`, 404)
  }
}

export class MissingFieldError extends AppError {
  constructor(field: string) {
    super('MISSING_FIELD', `Missing required field: ${field}`, 400)
  }
}
