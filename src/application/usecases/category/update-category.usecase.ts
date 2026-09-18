import { inject, injectable } from 'tsyringe';
import { Category } from '@core/entities/category.entity';
import { CategoryRepository } from '@core/repositories/category.repository';
import { NotFoundError } from '@core/errors/not-found.error';
import { ConflictError } from '@core/errors/conflict.error';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

@injectable()
export class UpdateCategoryUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.CategoryRepository)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  public async execute(id: string, input: UpdateCategoryInput): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError(`Categoría con ID '${id}' no encontrada`);
    }

    if (input.name && input.name.trim().toLowerCase() !== category.getName().toLowerCase()) {
      const existing = await this.categoryRepository.findByName(input.name.trim());
      if (existing) {
        throw new ConflictError(`Ya existe una categoría con el nombre '${input.name}'`);
      }
    }

    category.updateDetails(input.name, input.description);

    if (input.isActive !== undefined) {
      if (input.isActive) {
        category.activate();
      } else {
        category.deactivate();
      }
    }

    return this.categoryRepository.update(category);
  }
}
