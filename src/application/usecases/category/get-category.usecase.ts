import { inject, injectable } from 'tsyringe';
import { Category } from '@core/entities/category.entity';
import { CategoryRepository } from '@core/repositories/category.repository';
import { NotFoundError } from '@core/errors/not-found.error';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class GetCategoryUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.CategoryRepository)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  public async execute(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError(`Categoría con ID '${id}' no encontrada`);
    }
    return category;
  }
}
