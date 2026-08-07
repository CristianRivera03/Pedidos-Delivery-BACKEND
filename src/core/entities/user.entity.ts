import { Email } from '@core/value-objects/email.value-object';
import { Uuid } from '@core/value-objects/uuid.value-object';
import { ValidationError } from '@core/errors/validation.error';

export interface UserProps {
  id: Uuid;
  email: Email;
  name: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly _id: Uuid;
  private _email: Email;
  private _name: string;
  private _passwordHash: string;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._name = props.name;
    this._passwordHash = props.passwordHash;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public getId(): Uuid {
    return this._id;
  }

  public getEmail(): Email {
    return this._email;
  }

  public getName(): string {
    return this._name;
  }

  public getPasswordHash(): string {
    return this._passwordHash;
  }

  public isActive(): boolean {
    return this._isActive;
  }

  public getCreatedAt(): Date {
    return this._createdAt;
  }

  public getUpdatedAt(): Date {
    return this._updatedAt;
  }

  public changeName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Name cannot be empty');
    }
    this._name = name.trim();
    this._updatedAt = new Date();
  }

  public changeEmail(email: Email): void {
    this._email = email;
    this._updatedAt = new Date();
  }

  public changePasswordHash(passwordHash: string): void {
    this._passwordHash = passwordHash;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }
}
