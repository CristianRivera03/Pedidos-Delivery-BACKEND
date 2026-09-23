import { inject, injectable } from 'tsyringe';
import { Product } from '@core/entities/product.entity';
import { ProductRepository } from '@core/repositories/product.repository';
import { CategoryRepository } from '@core/repositories/category.repository';
import { NotFoundError } from '@core/errors/not-found.error';
import { Uuid } from '@core/value-objects/uuid.value-object';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

export interface CreateProductInput {
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
}

@injectable()
export class CreateProductUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.ProductRepository)
    private readonly productRepository: ProductRepository,
    @inject(REPOSITORY_SYMBOLS.CategoryRepository)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  public async execute(input: CreateProductInput): Promise<Product> {
    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new NotFoundError(`Categoría con ID '${input.categoryId}' no encontrada`);
    }

    const product = Product.create({
      categoryId: new Uuid(input.categoryId),
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      imageUrl: input.imageUrl,
    });

    return this.productRepository.create(product);
  }
}
