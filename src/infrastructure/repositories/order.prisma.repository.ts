import { inject, injectable } from 'tsyringe';
import { Order } from '@core/entities/order.entity';
import { OrderFilter, OrderRepository } from '@core/repositories/order.repository';
import { PaginatedResult } from '@core/repositories/pagination';
import { NotFoundError } from '@core/errors/not-found.error';
import { ConflictError } from '@core/errors/conflict.error';
import { PrismaClient } from '@infrastructure/database/prisma/prisma.client';
import { OrderPrismaMapper } from '@infrastructure/database/prisma/order.prisma.mapper';
import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { Prisma } from '@prisma/client';

@injectable()
export class OrderPrismaRepository implements OrderRepository {
  constructor(
    @inject(SERVICE_SYMBOLS.PrismaClient) private readonly prisma: PrismaClient,
  ) {}

  public async findById(id: string): Promise<Order | null> {
    const raw = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return raw ? OrderPrismaMapper.toDomain(raw) : null;
  }

  public async findPaginated(filter?: OrderFilter): Promise<PaginatedResult<Order>> {
    const where: Prisma.OrderWhereInput = {};

    if (filter?.userId) {
      where.userId = filter.userId;
    }
    if (filter?.status) {
      where.status = filter.status;
    }

    const page = filter?.page && filter.page > 0 ? filter.page : 1;
    const limit = filter?.limit && filter.limit > 0 ? filter.limit : 10;
    const skip = (page - 1) * limit;

    const [total, raws] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: raws.map((raw) => OrderPrismaMapper.toDomain(raw)),
      total,
      page,
      limit,
    };
  }

  public async createWithStockDeduction(order: Order): Promise<Order> {
    const created = await this.prisma.$transaction(async (tx) => {
      for (const item of order.getItems()) {
        const product = await tx.product.findUnique({
          where: { id: item.getProductId().getValue() },
        });

        if (!product || product.deletedAt || !product.isActive) {
          throw new NotFoundError('Producto', item.getProductId().getValue());
        }
        if (product.stock < item.getQuantity()) {
          throw new ConflictError(`Stock insuficiente para el producto '${product.name}'`);
        }

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.getQuantity() } },
        });
      }

      return tx.order.create({
        data: OrderPrismaMapper.toCreateData(order),
        include: { items: true },
      });
    });

    return OrderPrismaMapper.toDomain(created);
  }

  public async update(order: Order): Promise<Order> {
    const updated = await this.prisma.order.update({
      where: { id: order.getId().getValue() },
      data: OrderPrismaMapper.toUpdateData(order),
      include: { items: true },
    });
    return OrderPrismaMapper.toDomain(updated);
  }
}
