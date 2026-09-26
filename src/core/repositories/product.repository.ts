import { Product } from '@core/entities/product.entity';
import { PaginatedResult } from '@core/repositories/pagination';

export type { PaginatedResult };

export interface ProductFilter {
  categoryId?: string;
  search?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
  /** Si es true, devuelve todos los registros sin paginación */
  all?: boolean;
}

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(filter?: ProductFilter): Promise<Product[]>;
  findPaginated(filter?: ProductFilter): Promise<PaginatedResult<Product>>;
  create(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}

