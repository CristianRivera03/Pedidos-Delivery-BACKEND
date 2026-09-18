import { Category } from '@core/entities/category.entity';
import { CategoryRepository } from '@core/repositories/category.repository';

export class CategoryInMemoryRepository implements CategoryRepository {
  private categories: Map<string, Category> = new Map();

  public async findById(id: string): Promise<Category | null> {
    return this.categories.get(id) ?? null;
  }

  public async findByName(name: string): Promise<Category | null> {
    for (const category of this.categories.values()) {
      if (category.getName().toLowerCase() === name.toLowerCase()) {
        return category;
      }
    }
    return null;
  }

  public async findAll(filter?: { activeOnly?: boolean }): Promise<Category[]> {
    let result = Array.from(this.categories.values());
    if (filter?.activeOnly) {
      result = result.filter((c) => c.isActive());
    }
    return result.sort((a, b) => a.getName().localeCompare(b.getName()));
  }

  public async create(category: Category): Promise<Category> {
    this.categories.set(category.getId().getValue(), category);
    return category;
  }

  public async update(category: Category): Promise<Category> {
    this.categories.set(category.getId().getValue(), category);
    return category;
  }

  public async delete(id: string): Promise<void> {
    this.categories.delete(id);
  }

  public clear(): void {
    this.categories.clear();
  }
}
