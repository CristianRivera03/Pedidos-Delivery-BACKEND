import { inject, injectable } from 'tsyringe';
import { Product } from '@core/entities/product.entity';
import { ProductRepository } from '@core/repositories/product.repository';
import { NotFoundError } from '@core/errors/not-found.error';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class GetProductUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.ProductRepository)
    private readonly productRepository: ProductRepository,
  ) {}

  public async execute(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError(`Producto con ID '${id}' no encontrado`);
    }
    return product;
  }
}
