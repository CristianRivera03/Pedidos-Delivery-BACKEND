import { Uuid } from '@core/value-objects/uuid.value-object';
import { ValidationError } from '@core/errors/validation.error';

export interface CategoryProps {
  id: Uuid;
  name: string;
  description?: string | null;
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Category {
  private readonly _id: Uuid;
  private _name: string;
  private _description: string | null;
  private _isActive: boolean;
  private _deletedAt: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: CategoryProps) {
    Category.validateName(props.name);

    this._id = props.id;
    this._name = props.name.trim();
    this._description = props.description?.trim() || null;
    this._isActive = props.isActive;
    this._deletedAt = props.deletedAt ?? null;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: { name: string; description?: string | null }): Category {
    const now = new Date();
    return new Category({
      id: new Uuid(),
      name: props.name,
      description: props.description,
      isActive: true,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('El nombre de la categoría es requerido');
    }
    if (name.trim().length > 100) {
      throw new ValidationError('El nombre de la categoría no puede exceder 100 caracteres');
    }
  }

  public updateDetails(name?: string, description?: string | null): void {
    if (name !== undefined) {
      Category.validateName(name);
      this._name = name.trim();
    }
    if (description !== undefined) {
      this._description = description ? description.trim() : null;
    }
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  public softDelete(): void {
    const now = new Date();
    this._deletedAt = now;
    this._isActive = false;
    this._updatedAt = now;
  }

  public restore(): void {
    this._deletedAt = null;
    this._isActive = true;
    this._updatedAt = new Date();
  }

  public isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  public getId(): Uuid {
    return this._id;
  }

  public getName(): string {
    return this._name;
  }

  public getDescription(): string | null {
    return this._description;
  }

  public isActive(): boolean {
    return this._isActive;
  }

  public getDeletedAt(): Date | null {
    return this._deletedAt;
  }

  public getCreatedAt(): Date {
    return this._createdAt;
  }

  public getUpdatedAt(): Date {
    return this._updatedAt;
  }
}

