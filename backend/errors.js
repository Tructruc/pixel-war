class BaseAppError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ValidationError extends BaseAppError {
  constructor(message) {
    super(message)
    this.status = 400
  }
}

export class NotFoundError extends BaseAppError {
  constructor(message) {
    super(message)
    this.status = 404
  }
}

export class ConflictError extends BaseAppError {
  constructor(message) {
    super(message)
    this.status = 409
  }
}

export class InternalError extends BaseAppError {
  constructor(message) {
    super(message)
    this.status = 500
  }
}

export class TooManyRequestsError extends BaseAppError {
  constructor(message, nextTimestamp = null) {
    super(message)
    this.status = 429
    this.nextTimestamp = nextTimestamp
  }
}

export default {
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalError,
  TooManyRequestsError,
}
