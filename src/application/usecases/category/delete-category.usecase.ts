import { inject, injectable } from 'tsyringe';
import { CategoryRepository } from '@core/repositories/category.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { NotFoundError } from '@core/errors/not-found.error';
import { ConflictError } from '@core/errors/conflict.error';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class DeleteCategoryUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.CategoryRepository)
    private readonly categoryRepository: CategoryRepository,
    @inject(REPOSITORY_SYMBOLS.ProductRepository)
    private readonly productRepository: ProductRepository,
  ) {}

  public async execute(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError(`Categoría con ID '${id}' no encontrada`);
    }

    const associatedProducts = await this.productRepository.findAll({ categoryId: id });
    if (associatedProducts.length > 0) {
      throw new ConflictError('No se puede eliminar la categoría porque tiene productos asociados');
    }

    await this.categoryRepository.delete(id);
  }
}
