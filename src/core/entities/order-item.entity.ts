import { Uuid } from '@core/value-objects/uuid.value-object';
import { ValidationError } from '@core/errors/validation.error';

export interface OrderItemProps {
  id: Uuid;
  productId: Uuid;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export class OrderItem {
  private readonly _id: Uuid;
  private readonly _productId: Uuid;
  private readonly _productName: string;
  private readonly _unitPrice: number;
  private readonly _quantity: number;
  private readonly _subtotal: number;

  constructor(props: OrderItemProps) {
    OrderItem.validateQuantity(props.quantity);
    OrderItem.validateUnitPrice(props.unitPrice);

    this._id = props.id;
    this._productId = props.productId;
    this._productName = props.productName;
    this._unitPrice = Number(props.unitPrice);
    this._quantity = props.quantity;
    this._subtotal = Number(props.subtotal);
  }

  public static create(props: {
    productId: Uuid;
    productName: string;
    unitPrice: number;
    quantity: number;
  }): OrderItem {
    OrderItem.validateQuantity(props.quantity);
    OrderItem.validateUnitPrice(props.unitPrice);

    const subtotal = Math.round(props.unitPrice * props.quantity * 100) / 100;

    return new OrderItem({
      id: new Uuid(),
      productId: props.productId,
      productName: props.productName,
      unitPrice: props.unitPrice,
      quantity: props.quantity,
      subtotal,
    });
  }

  public static validateQuantity(quantity: number): void {
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError('La cantidad debe ser un número entero mayor a 0');
    }
  }

  public static validateUnitPrice(unitPrice: number): void {
    if (typeof unitPrice !== 'number' || Number.isNaN(unitPrice) || unitPrice <= 0) {
      throw new ValidationError('El precio unitario debe ser un número mayor a 0');
    }
  }

  public getId(): Uuid {
    return this._id;
  }

  public getProductId(): Uuid {
    return this._productId;
  }

  public getProductName(): string {
    return this._productName;
  }

  public getUnitPrice(): number {
    return this._unitPrice;
  }

  public getQuantity(): number {
    return this._quantity;
  }

  public getSubtotal(): number {
    return this._subtotal;
  }
}
