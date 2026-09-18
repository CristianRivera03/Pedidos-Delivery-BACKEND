import { Product as PrismaProduct, Prisma } from '@prisma/client';
import { Product } from '@core/entities/product.entity';
import { Uuid } from '@core/value-objects/uuid.value-object';

export class ProductPrismaMapper {
  public static toDomain(raw: PrismaProduct): Product {
    return new Product({
      id: new Uuid(raw.id),
      categoryId: new Uuid(raw.categoryId),
      name: raw.name,
      description: raw.description,
      price: Number(raw.price),
      stock: raw.stock,
      imageUrl: raw.imageUrl,
      isActive: raw.isActive,
      deletedAt: raw.deletedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public static toCreateData(product: Product): Prisma.ProductCreateInput {
    return {
      id: product.getId().getValue(),
      name: product.getName(),
      description: product.getDescription(),
      price: product.getPrice(),
      stock: product.getStock(),
      imageUrl: product.getImageUrl(),
      isActive: product.isActive(),
      deletedAt: product.getDeletedAt(),
      category: {
        connect: { id: product.getCategoryId().getValue() },
      },
    };
  }

  public static toUpdateData(product: Product): Prisma.ProductUpdateInput {
    return {
      name: product.getName(),
      description: product.getDescription(),
      price: product.getPrice(),
      stock: product.getStock(),
      imageUrl: product.getImageUrl(),
      isActive: product.isActive(),
      deletedAt: product.getDeletedAt(),
      category: {
        connect: { id: product.getCategoryId().getValue() },
      },
    };
  }
}

