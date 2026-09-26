import { Order } from '@core/entities/order.entity';
import { OrderFilter, OrderRepository } from '@core/repositories/order.repository';
import { PaginatedResult } from '@core/repositories/pagination';
import { NotFoundError } from '@core/errors/not-found.error';
import { ConflictError } from '@core/errors/conflict.error';
import { ProductInMemoryRepository } from '@infrastructure/repositories/product.in-memory.repository';

export class OrderInMemoryRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();

  constructor(private readonly productRepository: ProductInMemoryRepository) {}

  public async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  public async findPaginated(filter?: OrderFilter): Promise<PaginatedResult<Order>> {
    let result = Array.from(this.orders.values());

    if (filter?.userId) {
      result = result.filter((o) => o.getUserId().getValue() === filter.userId);
    }
    if (filter?.status) {
      result = result.filter((o) => o.getStatus() === filter.status);
    }

    result = result.sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime());

    const page = filter?.page && filter.page > 0 ? filter.page : 1;
    const limit = filter?.limit && filter.limit > 0 ? filter.limit : 10;
    const startIndex = (page - 1) * limit;

    return {
      items: result.slice(startIndex, startIndex + limit),
      total: result.length,
      page,
      limit,
    };
  }

  /**
   * Emula la transacción atómica del repositorio Prisma: valida todas las
   * líneas primero y solo después descuenta stock — válido en tests porque
   * JS es single-threaded, no es atomicidad real de base de datos.
   */
  public async createWithStockDeduction(order: Order): Promise<Order> {
    for (const item of order.getItems()) {
      const product = await this.productRepository.findById(item.getProductId().getValue());
      if (!product || !product.isActive()) {
        throw new NotFoundError('Producto', item.getProductId().getValue());
      }
      if (product.getStock() < item.getQuantity()) {
        throw new ConflictError(`Stock insuficiente para el producto '${product.getName()}'`);
      }
    }

    for (const item of order.getItems()) {
      const product = await this.productRepository.findById(item.getProductId().getValue());
      product!.adjustStock(-item.getQuantity());
      await this.productRepository.update(product!);
    }

    this.orders.set(order.getId().getValue(), order);
    return order;
  }

  public async update(order: Order): Promise<Order> {
    this.orders.set(order.getId().getValue(), order);
    return order;
  }

  public clear(): void {
    this.orders.clear();
  }
}
