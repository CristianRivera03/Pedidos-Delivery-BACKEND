import { inject, injectable } from 'tsyringe';
import { Category } from '@core/entities/category.entity';
import { CategoryRepository } from '@core/repositories/category.repository';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class ListCategoriesUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.CategoryRepository)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  public async execute(filter?: { activeOnly?: boolean }): Promise<Category[]> {
    return this.categoryRepository.findAll(filter);
  }
}
