import { Category as PrismaCategory, Prisma } from '@prisma/client';
import { Category } from '@core/entities/category.entity';
import { Uuid } from '@core/value-objects/uuid.value-object';

export class CategoryPrismaMapper {
  public static toDomain(raw: PrismaCategory): Category {
    return new Category({
      id: new Uuid(raw.id),
      name: raw.name,
      description: raw.description,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public static toCreateData(category: Category): Prisma.CategoryCreateInput {
    return {
      id: category.getId().getValue(),
      name: category.getName(),
      description: category.getDescription(),
      isActive: category.isActive(),
    };
  }

  public static toUpdateData(category: Category): Prisma.CategoryUpdateInput {
    return {
      name: category.getName(),
      description: category.getDescription(),
      isActive: category.isActive(),
    };
  }
}
