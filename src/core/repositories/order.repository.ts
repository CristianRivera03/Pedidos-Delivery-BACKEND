import { Order, OrderStatus } from '@core/entities/order.entity';
import { PaginatedResult } from '@core/repositories/pagination';

export interface OrderFilter {
  userId?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findPaginated(filter?: OrderFilter): Promise<PaginatedResult<Order>>;
  createWithStockDeduction(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
}
