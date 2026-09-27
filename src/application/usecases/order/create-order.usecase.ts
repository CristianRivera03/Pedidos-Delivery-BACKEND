import { inject, injectable } from 'tsyringe';
import { Order, PaymentMethod } from '@core/entities/order.entity';
import { OrderRepository } from '@core/repositories/order.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { PaymentService } from '@core/services/payment.service';
import { NotFoundError } from '@core/errors/not-found.error';
import { ConflictError } from '@core/errors/conflict.error';
import { ValidationError } from '@core/errors/validation.error';
import { Uuid } from '@core/value-objects/uuid.value-object';
import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

export interface CreateOrderInput {
  userId: string;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  items: { productId: string; quantity: number }[];
}

@injectable()
export class CreateOrderUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.ProductRepository)
    private readonly productRepository: ProductRepository,
    @inject(REPOSITORY_SYMBOLS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(SERVICE_SYMBOLS.PaymentService)
    private readonly paymentService: PaymentService,
  ) {}

  public async execute(input: CreateOrderInput): Promise<Order> {
    if (input.items.length === 0) {
      throw new ValidationError('El pedido debe tener al menos un producto');
    }

    // Pre-validación con lectura simple: falla rápido antes de tocar la escritura.
    // El chequeo vinculante contra condiciones de carrera ocurre de nuevo dentro
    // de la transacción en OrderRepository.createWithStockDeduction.
    const lines = [];
    for (const item of input.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product || !product.isActive()) {
        throw new NotFoundError('Producto', item.productId);
      }
      if (product.getStock() < item.quantity) {
        throw new ConflictError(`Stock insuficiente para el producto '${product.getName()}'`);
      }
      lines.push({
        productId: new Uuid(item.productId),
        productName: product.getName(),
        unitPrice: product.getPrice(),
        quantity: item.quantity,
      });
    }

    const order = Order.create({
      userId: new Uuid(input.userId),
      paymentMethod: input.paymentMethod,
      deliveryAddress: input.deliveryAddress,
      items: lines,
    });

    const persisted = await this.orderRepository.createWithStockDeduction(order);

    // El cobro se hace fuera de la transacción de DB: no conviene sostener
    // locks de fila mientras se llama a una pasarela externa (aquí simulada).
    if (persisted.getPaymentMethod() === 'CARD') {
      const result = await this.paymentService.charge(persisted.getTotal());
      if (!result.success) {
        throw new ValidationError('Pago con tarjeta rechazado');
      }
    }

    persisted.transitionTo('PAGADO');
    return this.orderRepository.update(persisted);
  }
}
