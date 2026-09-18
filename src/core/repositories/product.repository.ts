import { Product } from '@core/entities/product.entity';

export interface ProductFilter {
  categoryId?: string;
  search?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(filter?: ProductFilter): Promise<Product[]>;
  findPaginated(filter?: ProductFilter): Promise<PaginatedResult<Product>>;
  create(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}

