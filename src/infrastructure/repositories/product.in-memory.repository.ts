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

