import { Request, Response } from 'express';
import { container, inject, injectable } from 'tsyringe';
import { CreateCategoryUseCase } from '@application/usecases/category/create-category.usecase';
import { GetCategoryUseCase } from '@application/usecases/category/get-category.usecase';
import { ListCategoriesUseCase } from '@application/usecases/category/list-categories.usecase';
import { UpdateCategoryUseCase } from '@application/usecases/category/update-category.usecase';
import { DeleteCategoryUseCase } from '@application/usecases/category/delete-category.usecase';
import { CategoryMapper } from '@application/mappers/category.mapper';
import { CreateCategoryInput, UpdateCategoryInput } from '@interfaces/http/validators/category.validator';
import { USE_CASE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { sendSuccess } from '@interfaces/http/responses/response.util';

@injectable()
export class CategoryController {
  constructor(
    @inject(USE_CASE_SYMBOLS.CreateCategoryUseCase)
    private readonly createUseCase: CreateCategoryUseCase,
    @inject(USE_CASE_SYMBOLS.GetCategoryUseCase)
    private readonly getUseCase: GetCategoryUseCase,
    @inject(USE_CASE_SYMBOLS.ListCategoriesUseCase)
    private readonly listUseCase: ListCategoriesUseCase,
    @inject(USE_CASE_SYMBOLS.UpdateCategoryUseCase)
    private readonly updateUseCase: UpdateCategoryUseCase,
    @inject(USE_CASE_SYMBOLS.DeleteCategoryUseCase)
    private readonly deleteUseCase: DeleteCategoryUseCase,
  ) {}

  public async list(req: Request, res: Response): Promise<void> {
    const activeOnly = req.query.activeOnly === 'true' ? true : req.query.activeOnly === 'false' ? false : undefined;
    const categories = await this.listUseCase.execute({ activeOnly });
    sendSuccess(req, res, CategoryMapper.toDtoList(categories), 200);
  }

  public async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const category = await this.getUseCase.execute(id);
    sendSuccess(req, res, CategoryMapper.toDto(category), 200);
  }

  public async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateCategoryInput;
    const category = await this.createUseCase.execute(dto);
    sendSuccess(req, res, CategoryMapper.toDto(category), 201);
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const dto = req.body as UpdateCategoryInput;
    const category = await this.updateUseCase.execute(id, dto);
    sendSuccess(req, res, CategoryMapper.toDto(category), 200);
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    await this.deleteUseCase.execute(id);
    res.status(204).send();
  }
}

export function buildCategoryController(): CategoryController {
  return container.resolve(CategoryController);
}
