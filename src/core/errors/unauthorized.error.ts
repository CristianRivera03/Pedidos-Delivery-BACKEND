import { DomainError } from './domain.error';

export class UnauthorizedError extends DomainError {
  public readonly httpStatus: number = 401;

  constructor(message: string = 'Unauthorized') {
    super(message);
  }
}
