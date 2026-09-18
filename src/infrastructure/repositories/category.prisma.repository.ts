import { inject, injectable } from 'tsyringe';
import { Category } from '@core/entities/category.entity';
import { CategoryRepository } from '@core/repositories/category.repository';
import { PrismaClient } from '@infrastructure/database/prisma/prisma.client';
import { CategoryPrismaMapper } from '@infrastructure/database/prisma/category.prisma.mapper';
import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class CategoryPrismaRepository implements CategoryRepository {
  constructor(
    @inject(SERVICE_SYMBOLS.PrismaClient) private readonly prisma: PrismaClient,
  ) {}

  public async findById(id: string): Promise<Category | null> {
    const raw = await this.prisma.category.findUnique({ where: { id } });
    return raw ? CategoryPrismaMapper.toDomain(raw) : null;
  }

  public async findByName(name: string): Promise<Category | null> {
    const raw = await this.prisma.category.findUnique({ where: { name } });
    return raw ? CategoryPrismaMapper.toDomain(raw) : null;
  }

  public async findAll(filter?: { activeOnly?: boolean }): Promise<Category[]> {
    const where = filter?.activeOnly ? { isActive: true } : undefined;
    const raws = await this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return raws.map((raw) => CategoryPrismaMapper.toDomain(raw));
  }

  public async create(category: Category): Promise<Category> {
    const data = CategoryPrismaMapper.toCreateData(category);
    const created = await this.prisma.category.create({ data });
    return CategoryPrismaMapper.toDomain(created);
  }

  public async update(category: Category): Promise<Category> {
    const data = CategoryPrismaMapper.toUpdateData(category);
    const updated = await this.prisma.category.update({
      where: { id: category.getId().getValue() },
      data,
    });
    return CategoryPrismaMapper.toDomain(updated);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
