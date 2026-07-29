import { DomainError } from './domain.error';

export class ValidationError extends DomainError {
  public readonly httpStatus: number = 400;

  constructor(message: string) {
    super(message);
  }
}
