import { toElSalvadorIsoString } from '@application/utils/el-salvador-date.util';
import { OrderDto, OrderItemDto } from '@application/dto/order.dto';
import { Order } from '@core/entities/order.entity';
import { OrderItem } from '@core/entities/order-item.entity';

export class OrderMapper {
  public static toItemDto(item: OrderItem): OrderItemDto {
    return {
      id: item.getId().getValue(),
      productId: item.getProductId().getValue(),
      productName: item.getProductName(),
      unitPrice: item.getUnitPrice(),
      quantity: item.getQuantity(),
      subtotal: item.getSubtotal(),
    };
  }

  public static toDto(order: Order): OrderDto {
    return {
      id: order.getId().getValue(),
      userId: order.getUserId().getValue(),
      status: order.getStatus(),
      paymentMethod: order.getPaymentMethod(),
      deliveryAddress: order.getDeliveryAddress(),
      items: order.getItems().map((item) => this.toItemDto(item)),
      subtotal: order.getSubtotal(),
      taxAmount: order.getTaxAmount(),
      total: order.getTotal(),
      cashCollectedAt: order.getCashCollectedAt() ? toElSalvadorIsoString(order.getCashCollectedAt()!) : null,
      createdAt: toElSalvadorIsoString(order.getCreatedAt()),
      updatedAt: toElSalvadorIsoString(order.getUpdatedAt()),
    };
  }

  public static toDtoList(orders: Order[]): OrderDto[] {
    return orders.map((o) => this.toDto(o));
  }
}
