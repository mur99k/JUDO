class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'غير موجود') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class AuthError extends AppError {
  constructor(message = 'غير مصرح') {
    super(message, 401);
    this.name = 'AuthError';
  }
}

class ValidationError extends AppError {
  constructor(message = 'بيانات غير صحيحة') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

module.exports = { AppError, NotFoundError, AuthError, ValidationError };
