import { Uuid } from '@core/value-objects/uuid.value-object';
import { ValidationError } from '@core/errors/validation.error';

export interface ProductProps {
  id: Uuid;
  categoryId: Uuid;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private readonly _id: Uuid;
  private _categoryId: Uuid;
  private _name: string;
  private _description: string | null;
  private _price: number;
  private _stock: number;
  private _imageUrl: string | null;
  private _isActive: boolean;
  private _deletedAt: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ProductProps) {
    Product.validateName(props.name);
    Product.validatePrice(props.price);
    Product.validateStock(props.stock);

    this._id = props.id;
    this._categoryId = props.categoryId;
    this._name = props.name.trim();
    this._description = props.description?.trim() || null;
    this._price = Number(props.price);
    this._stock = Number(props.stock);
    this._imageUrl = props.imageUrl?.trim() || null;
    this._isActive = props.isActive;
    this._deletedAt = props.deletedAt ?? null;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: {
    categoryId: Uuid;
    name: string;
    description?: string | null;
    price: number;
    stock: number;
    imageUrl?: string | null;
  }): Product {
    const now = new Date();
    return new Product({
      id: new Uuid(),
      categoryId: props.categoryId,
      name: props.name,
      description: props.description,
      price: props.price,
      stock: props.stock,
      imageUrl: props.imageUrl,
      isActive: true,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('El nombre del producto es requerido');
    }
    if (name.trim().length > 150) {
      throw new ValidationError('El nombre del producto no puede exceder 150 caracteres');
    }
  }

  public static validatePrice(price: number): void {
    if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) {
      throw new ValidationError('El precio debe ser un número mayor a 0 (precio > 0)');
    }
  }

  public static validateStock(stock: number): void {
    if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
      throw new ValidationError('El stock debe ser un número entero mayor o igual a 0 (stock >= 0)');
    }
  }

  public updateDetails(props: {
    categoryId?: Uuid;
    name?: string;
    description?: string | null;
    price?: number;
    stock?: number;
    imageUrl?: string | null;
  }): void {
    if (props.categoryId !== undefined) {
      this._categoryId = props.categoryId;
    }
    if (props.name !== undefined) {
      Product.validateName(props.name);
      this._name = props.name.trim();
    }
    if (props.description !== undefined) {
      this._description = props.description ? props.description.trim() : null;
    }
    if (props.price !== undefined) {
      Product.validatePrice(props.price);
      this._price = props.price;
    }
    if (props.stock !== undefined) {
      Product.validateStock(props.stock);
      this._stock = props.stock;
    }
    if (props.imageUrl !== undefined) {
      this._imageUrl = props.imageUrl ? props.imageUrl.trim() : null;
    }
    this._updatedAt = new Date();
  }

  public adjustStock(quantityDelta: number): void {
    const newStock = this._stock + quantityDelta;
    Product.validateStock(newStock);
    this._stock = newStock;
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

  public getCategoryId(): Uuid {
    return this._categoryId;
  }

  public getName(): string {
    return this._name;
  }

  public getDescription(): string | null {
    return this._description;
  }

  public getPrice(): number {
    return this._price;
  }

  public getStock(): number {
    return this._stock;
  }

  public getImageUrl(): string | null {
    return this._imageUrl;
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

