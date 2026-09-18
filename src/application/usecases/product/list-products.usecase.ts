import { inject, injectable } from 'tsyringe';
import { Product } from '@core/entities/product.entity';
import { ProductFilter, ProductRepository } from '@core/repositories/product.repository';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class ListProductsUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.ProductRepository)
    private readonly productRepository: ProductRepository,
  ) {}

  public async execute(filter?: ProductFilter): Promise<Product[]> {
    return this.productRepository.findAll(filter);
  }
}
