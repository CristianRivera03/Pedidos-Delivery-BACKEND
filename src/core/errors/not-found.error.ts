import { DomainError } from './domain.error';

export class NotFoundError extends DomainError {
  public readonly httpStatus: number = 404;

  constructor(resource: string, identifier?: string) {
    super(
      identifier
        ? `${resource} with identifier '${identifier}' was not found`
        : `${resource} was not found`,
    );
  }
}
