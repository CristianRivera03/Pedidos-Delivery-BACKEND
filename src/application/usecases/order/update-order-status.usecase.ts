import { inject, injectable } from 'tsyringe';
import { Order, OrderStatus } from '@core/entities/order.entity';
import { OrderRepository } from '@core/repositories/order.repository';
import { NotFoundError } from '@core/errors/not-found.error';
import { ForbiddenError } from '@core/errors/forbidden.error';
import { ValidationError } from '@core/errors/validation.error';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';
import { OrderRequester } from '@application/usecases/order/list-orders.usecase';

@injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.OrderRepository)
    private readonly orderRepository: OrderRepository,
  ) {}

  public async execute(id: string, targetStatus: OrderStatus, requester: OrderRequester): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Pedido', id);
    }

    this.assertCanTransition(order, targetStatus, requester);

    order.transitionTo(targetStatus);
    return this.orderRepository.update(order);
  }

  private assertCanTransition(order: Order, targetStatus: OrderStatus, requester: OrderRequester): void {
    if (requester.role === 'ADMIN') {
      return;
    }

    switch (targetStatus) {
      case 'EN_PREPARACION':
        if (requester.role !== 'RESTAURANT') {
          throw new ForbiddenError('Solo ADMIN o RESTAURANT pueden mover un pedido a EN_PREPARACION');
        }
        return;
      case 'EN_CAMINO':
      case 'ENTREGADO':
        if (requester.role !== 'DELIVERY') {
          throw new ForbiddenError('Solo ADMIN o DELIVERY pueden actualizar este estado');
        }
        return;
      case 'CANCELADO':
        if (requester.role !== 'CUSTOMER' || order.getUserId().getValue() !== requester.id) {
          throw new ForbiddenError('Solo el dueño del pedido o ADMIN pueden cancelarlo');
        }
        return;
      default:
        throw new ValidationError(`Estado destino inválido: ${targetStatus}`);
    }
  }
}
