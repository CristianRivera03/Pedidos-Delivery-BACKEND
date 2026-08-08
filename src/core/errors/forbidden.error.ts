import { DomainError } from './domain.error';

export class ForbiddenError extends DomainError {
  public readonly httpStatus: number = 403;

  constructor(message: string = 'Forbidden') {
    super(message);
  }
}
