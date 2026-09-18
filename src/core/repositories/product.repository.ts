import { Product } from '@core/entities/product.entity';

export interface ProductFilter {
  categoryId?: string;
  search?: string;
  activeOnly?: boolean;
}

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(filter?: ProductFilter): Promise<Product[]>;
  create(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}
