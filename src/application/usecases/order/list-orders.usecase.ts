import { inject, injectable } from 'tsyringe';
import { Role } from '@core/entities/user.entity';
import { Order } from '@core/entities/order.entity';
import { OrderFilter, OrderRepository } from '@core/repositories/order.repository';
import { PaginatedResult } from '@core/repositories/pagination';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

export interface OrderRequester {
  id: string;
  role: Role;
}

@injectable()
export class ListOrdersUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.OrderRepository)
    private readonly orderRepository: OrderRepository,
  ) {}

  public async execute(filter: OrderFilter, requester: OrderRequester): Promise<PaginatedResult<Order>> {
    const scopedFilter: OrderFilter = { ...filter };

    // El cliente solo puede ver sus propias órdenes, sin importar qué filtro envíe.
    if (requester.role === 'CUSTOMER') {
      scopedFilter.userId = requester.id;
    }

    return this.orderRepository.findPaginated(scopedFilter);
  }
}
