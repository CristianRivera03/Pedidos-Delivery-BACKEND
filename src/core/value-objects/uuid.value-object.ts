import { randomUUID } from 'crypto';

import { ValidationError } from '@core/errors/validation.error';

export class Uuid {
  private readonly value: string;

  constructor(value?: string) {
    this.value = value ?? randomUUID();
    this.validate(this.value);
  }

  private validate(value: string): void {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(value)) {
      throw new ValidationError(`Invalid UUID format: ${value}`);
    }
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Uuid): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}