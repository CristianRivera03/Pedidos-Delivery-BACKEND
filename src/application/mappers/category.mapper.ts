import { toElSalvadorIsoString } from '@application/utils/el-salvador-date.util';
import { Category } from '@core/entities/category.entity';

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class CategoryMapper {
  public static toDto(category: Category): CategoryDto {
    return {
      id: category.getId().getValue(),
      name: category.getName(),
      description: category.getDescription(),
      isActive: category.isActive(),
      createdAt: toElSalvadorIsoString(category.getCreatedAt()),
      updatedAt: toElSalvadorIsoString(category.getUpdatedAt()),
    };
  }

  public static toDtoList(categories: Category[]): CategoryDto[] {
    return categories.map((c) => this.toDto(c));
  }
}
