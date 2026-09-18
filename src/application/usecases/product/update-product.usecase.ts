import { inject, injectable } from 'tsyringe';
import { Product } from '@core/entities/product.entity';
import { ProductRepository } from '@core/repositories/product.repository';
import { CategoryRepository } from '@core/repositories/category.repository';
import { NotFoundError } from '@core/errors/not-found.error';
import { Uuid } from '@core/value-objects/uuid.value-object';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

export interface UpdateProductInput {
  categoryId?: string;
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  imageUrl?: string | null;
  isActive?: boolean;
}

@injectable()
export class UpdateProductUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.ProductRepository)
    private readonly productRepository: ProductRepository,
    @inject(REPOSITORY_SYMBOLS.CategoryRepository)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  public async execute(id: string, input: UpdateProductInput): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError(`Producto con ID '${id}' no encontrado`);
    }

    if (input.categoryId !== undefined) {
      const category = await this.categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new NotFoundError(`Categoría con ID '${input.categoryId}' no encontrada`);
      }
    }

    product.updateDetails({
      categoryId: input.categoryId ? new Uuid(input.categoryId) : undefined,
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      imageUrl: input.imageUrl,
    });

    if (input.isActive !== undefined) {
      if (input.isActive) {
        product.activate();
      } else {
        product.deactivate();
      }
    }

    return this.productRepository.update(product);
  }
}
