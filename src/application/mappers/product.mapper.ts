import { toElSalvadorIsoString } from '@application/utils/el-salvador-date.util';
import { Product } from '@core/entities/product.entity';

export interface ProductDto {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ProductMapper {
  public static toDto(product: Product): ProductDto {
    return {
      id: product.getId().getValue(),
      categoryId: product.getCategoryId().getValue(),
      name: product.getName(),
      description: product.getDescription(),
      price: product.getPrice(),
      stock: product.getStock(),
      imageUrl: product.getImageUrl(),
      isActive: product.isActive(),
      createdAt: toElSalvadorIsoString(product.getCreatedAt()),
      updatedAt: toElSalvadorIsoString(product.getUpdatedAt()),
    };
  }

  public static toDtoList(products: Product[]): ProductDto[] {
    return products.map((p) => this.toDto(p));
  }
}
