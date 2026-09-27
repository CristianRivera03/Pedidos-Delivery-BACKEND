import { Order as PrismaOrder, OrderItem as PrismaOrderItem, Prisma } from '@prisma/client';
import { Order } from '@core/entities/order.entity';
import { OrderItem } from '@core/entities/order-item.entity';
import { Uuid } from '@core/value-objects/uuid.value-object';

type PrismaOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

export class OrderPrismaMapper {
  public static toDomain(raw: PrismaOrderWithItems): Order {
    const items = raw.items.map(
      (item) =>
        new OrderItem({
          id: new Uuid(item.id),
          productId: new Uuid(item.productId),
          productName: item.productName,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
        }),
    );

    return new Order({
      id: new Uuid(raw.id),
      userId: new Uuid(raw.userId),
      status: raw.status,
      paymentMethod: raw.paymentMethod,
      deliveryAddress: raw.deliveryAddress,
      items,
      subtotal: Number(raw.subtotal),
      taxAmount: Number(raw.taxAmount),
      total: Number(raw.total),
      cashCollectedAt: raw.cashCollectedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public static toCreateData(order: Order): Prisma.OrderCreateInput {
    return {
      id: order.getId().getValue(),
      status: order.getStatus(),
      paymentMethod: order.getPaymentMethod(),
      deliveryAddress: order.getDeliveryAddress(),
      subtotal: order.getSubtotal(),
      taxAmount: order.getTaxAmount(),
      total: order.getTotal(),
      cashCollectedAt: order.getCashCollectedAt(),
      user: {
        connect: { id: order.getUserId().getValue() },
      },
      items: {
        create: order.getItems().map((item) => ({
          id: item.getId().getValue(),
          productName: item.getProductName(),
          unitPrice: item.getUnitPrice(),
          quantity: item.getQuantity(),
          subtotal: item.getSubtotal(),
          product: {
            connect: { id: item.getProductId().getValue() },
          },
        })),
      },
    };
  }

  public static toUpdateData(order: Order): Prisma.OrderUpdateInput {
    return {
      status: order.getStatus(),
      cashCollectedAt: order.getCashCollectedAt(),
    };
  }
}
