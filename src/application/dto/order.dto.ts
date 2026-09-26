import { OrderStatus, PaymentMethod } from '@core/entities/order.entity';

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDto {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  items: OrderItemDto[];
  subtotal: number;
  taxAmount: number;
  total: number;
  cashCollectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
