import { inject, injectable } from 'tsyringe';
import { Category } from '@core/entities/category.entity';
import { CategoryRepository } from '@core/repositories/category.repository';
import { ConflictError } from '@core/errors/conflict.error';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
}

@injectable()
export class CreateCategoryUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.CategoryRepository)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  public async execute(input: CreateCategoryInput): Promise<Category> {
    const existing = await this.categoryRepository.findByName(input.name.trim());
    if (existing) {
      throw new ConflictError(`Ya existe una categoría con el nombre '${input.name}'`);
    }

    const category = Category.create({
      name: input.name,
      description: input.description,
    });

    return this.categoryRepository.create(category);
  }
}
