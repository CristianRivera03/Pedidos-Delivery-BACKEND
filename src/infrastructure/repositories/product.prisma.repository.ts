import { inject, injectable } from 'tsyringe';
import { Product } from '@core/entities/product.entity';
import { ProductFilter, ProductRepository } from '@core/repositories/product.repository';
import { PrismaClient } from '@infrastructure/database/prisma/prisma.client';
import { ProductPrismaMapper } from '@infrastructure/database/prisma/product.prisma.mapper';
import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { Prisma } from '@prisma/client';

@injectable()
export class ProductPrismaRepository implements ProductRepository {
  constructor(
    @inject(SERVICE_SYMBOLS.PrismaClient) private readonly prisma: PrismaClient,
  ) {}

  public async findById(id: string): Promise<Product | null> {
    const raw = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    return raw ? ProductPrismaMapper.toDomain(raw) : null;
  }

  public async findAll(filter?: ProductFilter): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (filter?.activeOnly) {
      where.isActive = true;
    }
    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    }
    if (filter?.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }

    const raws = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return raws.map((raw) => ProductPrismaMapper.toDomain(raw));
  }

  public async findPaginated(filter?: ProductFilter): Promise<{ items: Product[]; total: number; page: number; limit: number }> {
    // Si se solicitan todos los registros sin paginación
    if (filter?.all) {
      const items = await this.findAll(filter);
      return { items, total: items.length, page: 1, limit: items.length };
    }

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (filter?.activeOnly) {
      where.isActive = true;
    }
    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    }
    if (filter?.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }

    const page = filter?.page && filter.page > 0 ? filter.page : 1;
    const limit = filter?.limit && filter.limit > 0 ? filter.limit : 10;
    const skip = (page - 1) * limit;

    const [total, raws] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: raws.map((raw) => ProductPrismaMapper.toDomain(raw)),
      total,
      page,
      limit,
    };
  }


  public async create(product: Product): Promise<Product> {
    const data = ProductPrismaMapper.toCreateData(product);
    const created = await this.prisma.product.create({ data });
    return ProductPrismaMapper.toDomain(created);
  }

  public async update(product: Product): Promise<Product> {
    const data = ProductPrismaMapper.toUpdateData(product);
    const updated = await this.prisma.product.update({
      where: { id: product.getId().getValue() },
      data,
    });
    return ProductPrismaMapper.toDomain(updated);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}

