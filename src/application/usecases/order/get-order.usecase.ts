import { inject, injectable } from 'tsyringe';
import { Order } from '@core/entities/order.entity';
import { OrderRepository } from '@core/repositories/order.repository';
import { NotFoundError } from '@core/errors/not-found.error';
import { ForbiddenError } from '@core/errors/forbidden.error';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';
import { OrderRequester } from '@application/usecases/order/list-orders.usecase';

@injectable()
export class GetOrderUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.OrderRepository)
    private readonly orderRepository: OrderRepository,
  ) {}

  public async execute(id: string, requester: OrderRequester): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Pedido', id);
    }

    if (requester.role === 'CUSTOMER' && order.getUserId().getValue() !== requester.id) {
      throw new ForbiddenError('No tienes acceso a este pedido');
    }

    return order;
  }
}
