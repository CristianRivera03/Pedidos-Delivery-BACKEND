import { Request, Response } from 'express';
import { container, inject, injectable } from 'tsyringe';
import { CreateProductUseCase } from '@application/usecases/product/create-product.usecase';
import { GetProductUseCase } from '@application/usecases/product/get-product.usecase';
import { ListProductsUseCase } from '@application/usecases/product/list-products.usecase';
import { UpdateProductUseCase } from '@application/usecases/product/update-product.usecase';
import { DeleteProductUseCase } from '@application/usecases/product/delete-product.usecase';
import { ProductMapper } from '@application/mappers/product.mapper';
import { CreateProductInput, ListProductsQuery, UpdateProductInput } from '@interfaces/http/validators/product.validator';
import { USE_CASE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { sendSuccess } from '@interfaces/http/responses/response.util';

@injectable()
export class ProductController {
  constructor(
    @inject(USE_CASE_SYMBOLS.CreateProductUseCase)
    private readonly createUseCase: CreateProductUseCase,
    @inject(USE_CASE_SYMBOLS.GetProductUseCase)
    private readonly getUseCase: GetProductUseCase,
    @inject(USE_CASE_SYMBOLS.ListProductsUseCase)
    private readonly listUseCase: ListProductsUseCase,
    @inject(USE_CASE_SYMBOLS.UpdateProductUseCase)
    private readonly updateUseCase: UpdateProductUseCase,
    @inject(USE_CASE_SYMBOLS.DeleteProductUseCase)
    private readonly deleteUseCase: DeleteProductUseCase,
  ) {}

  public async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListProductsQuery;
    const page = query.page !== undefined ? Number(query.page) : 1;
    const limit = query.limit !== undefined ? Number(query.limit) : 10;

    const result = await this.listUseCase.execute({
      categoryId: query.categoryId,
      search: query.search,
      activeOnly: query.activeOnly,
      page,
      limit,
    });

    const totalPages = Math.ceil(result.total / limit);

    sendSuccess(
      req,
      res,
      ProductMapper.toDtoList(result.items),
      200,
      {
        page,
        limit,
        totalItems: result.total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    );
  }

  public async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const product = await this.getUseCase.execute(id);
    sendSuccess(req, res, ProductMapper.toDto(product), 200);
  }

  public async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateProductInput;
    const product = await this.createUseCase.execute(dto);
    sendSuccess(req, res, ProductMapper.toDto(product), 201);
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const dto = req.body as UpdateProductInput;
    const product = await this.updateUseCase.execute(id, dto);
    sendSuccess(req, res, ProductMapper.toDto(product), 200);
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    await this.deleteUseCase.execute(id);
    res.status(204).send();
  }
}

export function buildProductController(): ProductController {
  return container.resolve(ProductController);
}
