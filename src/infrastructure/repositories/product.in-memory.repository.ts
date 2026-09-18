import { Product } from '@core/entities/product.entity';
import { ProductFilter, ProductRepository } from '@core/repositories/product.repository';

export class ProductInMemoryRepository implements ProductRepository {
  private products: Map<string, Product> = new Map();

  public async findById(id: string): Promise<Product | null> {
    const product = this.products.get(id);
    if (!product || product.isDeleted()) {
      return null;
    }
    return product;
  }

  public async findAll(filter?: ProductFilter): Promise<Product[]> {
    let result = Array.from(this.products.values()).filter((p) => !p.isDeleted());

    if (filter?.activeOnly) {
      result = result.filter((p) => p.isActive());
    }
    if (filter?.categoryId) {
      result = result.filter((p) => p.getCategoryId().getValue() === filter.categoryId);
    }
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter((p) => p.getName().toLowerCase().includes(searchLower));
    }

    return result.sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime());
  }

  public async findPaginated(filter?: ProductFilter): Promise<{ items: Product[]; total: number; page: number; limit: number }> {
    const allItems = await this.findAll(filter);

    // Si se solicitan todos los registros sin paginación
    if (filter?.all) {
      return { items: allItems, total: allItems.length, page: 1, limit: allItems.length };
    }

    const page = filter?.page && filter.page > 0 ? filter.page : 1;
    const limit = filter?.limit && filter.limit > 0 ? filter.limit : 10;
    const startIndex = (page - 1) * limit;
    const items = allItems.slice(startIndex, startIndex + limit);

    return {
      items,
      total: allItems.length,
      page,
      limit,
    };
  }


  public async create(product: Product): Promise<Product> {
    this.products.set(product.getId().getValue(), product);
    return product;
  }

  public async update(product: Product): Promise<Product> {
    this.products.set(product.getId().getValue(), product);
    return product;
  }

  public async delete(id: string): Promise<void> {
    const product = this.products.get(id);
    if (product) {
      product.softDelete();
    }
  }

  public clear(): void {
    this.products.clear();
  }
}

