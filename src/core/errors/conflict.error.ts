import { DomainError } from './domain.error';

export class ConflictError extends DomainError {
  public readonly httpStatus: number = 409;

  constructor(message: string) {
    super(message);
  }
}
