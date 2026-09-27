import { Uuid } from '@core/value-objects/uuid.value-object';
import { ValidationError } from '@core/errors/validation.error';
import { OrderItem } from '@core/entities/order-item.entity';

export type OrderStatus = 'CREADO' | 'PAGADO' | 'EN_PREPARACION' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';
export type PaymentMethod = 'CARD' | 'CASH';

export const IVA_RATE = 0.13;

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREADO: ['PAGADO', 'CANCELADO'],
  PAGADO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['EN_CAMINO', 'CANCELADO'],
  EN_CAMINO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export interface OrderProps {
  id: Uuid;
  userId: Uuid;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  cashCollectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  private readonly _id: Uuid;
  private readonly _userId: Uuid;
  private _status: OrderStatus;
  private readonly _paymentMethod: PaymentMethod;
  private readonly _deliveryAddress: string;
  private readonly _items: OrderItem[];
  private readonly _subtotal: number;
  private readonly _taxAmount: number;
  private readonly _total: number;
  private _cashCollectedAt: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: OrderProps) {
    Order.validateDeliveryAddress(props.deliveryAddress);
    if (props.items.length === 0) {
      throw new ValidationError('El pedido debe tener al menos un producto');
    }

    this._id = props.id;
    this._userId = props.userId;
    this._status = props.status;
    this._paymentMethod = props.paymentMethod;
    this._deliveryAddress = props.deliveryAddress.trim();
    this._items = props.items;
    this._subtotal = Number(props.subtotal);
    this._taxAmount = Number(props.taxAmount);
    this._total = Number(props.total);
    this._cashCollectedAt = props.cashCollectedAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: {
    userId: Uuid;
    paymentMethod: PaymentMethod;
    deliveryAddress: string;
    items: { productId: Uuid; productName: string; unitPrice: number; quantity: number }[];
  }): Order {
    Order.validateDeliveryAddress(props.deliveryAddress);
    if (props.items.length === 0) {
      throw new ValidationError('El pedido debe tener al menos un producto');
    }

    const items = props.items.map((item) =>
      OrderItem.create({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      }),
    );

    const subtotal = Math.round(items.reduce((sum, item) => sum + item.getSubtotal(), 0) * 100) / 100;
    const taxAmount = Math.round(subtotal * IVA_RATE * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    const now = new Date();

    return new Order({
      id: new Uuid(),
      userId: props.userId,
      status: 'CREADO',
      paymentMethod: props.paymentMethod,
      deliveryAddress: props.deliveryAddress,
      items,
      subtotal,
      taxAmount,
      total,
      cashCollectedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static validateDeliveryAddress(deliveryAddress: string): void {
    if (!deliveryAddress || deliveryAddress.trim().length === 0) {
      throw new ValidationError('La dirección de entrega es requerida');
    }
    if (deliveryAddress.trim().length > 255) {
      throw new ValidationError('La dirección de entrega no puede exceder 255 caracteres');
    }
  }

  public transitionTo(newStatus: OrderStatus): void {
    const allowed = ORDER_TRANSITIONS[this._status];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(`Transición de estado inválida: ${this._status} -> ${newStatus}`);
    }

    this._status = newStatus;
    if (newStatus === 'ENTREGADO' && this._paymentMethod === 'CASH') {
      this._cashCollectedAt = new Date();
    }
    this._updatedAt = new Date();
  }

  public getId(): Uuid {
    return this._id;
  }

  public getUserId(): Uuid {
    return this._userId;
  }

  public getStatus(): OrderStatus {
    return this._status;
  }

  public getPaymentMethod(): PaymentMethod {
    return this._paymentMethod;
  }

  public getDeliveryAddress(): string {
    return this._deliveryAddress;
  }

  public getItems(): OrderItem[] {
    return this._items;
  }

  public getSubtotal(): number {
    return this._subtotal;
  }

  public getTaxAmount(): number {
    return this._taxAmount;
  }

  public getTotal(): number {
    return this._total;
  }

  public getCashCollectedAt(): Date | null {
    return this._cashCollectedAt;
  }

  public getCreatedAt(): Date {
    return this._createdAt;
  }

  public getUpdatedAt(): Date {
    return this._updatedAt;
  }
}
