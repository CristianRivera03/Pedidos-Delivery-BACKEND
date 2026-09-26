import { Request, Response } from 'express';
import { container, inject, injectable } from 'tsyringe';
import { CreateOrderUseCase } from '@application/usecases/order/create-order.usecase';
import { ListOrdersUseCase } from '@application/usecases/order/list-orders.usecase';
import { GetOrderUseCase } from '@application/usecases/order/get-order.usecase';
import { UpdateOrderStatusUseCase } from '@application/usecases/order/update-order-status.usecase';
import { OrderMapper } from '@application/mappers/order.mapper';
import {
  CheckoutOrderInput,
  ListOrdersQuery,
  UpdateOrderStatusInput,
} from '@interfaces/http/validators/order.validator';
import { USE_CASE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { sendSuccess } from '@interfaces/http/responses/response.util';

@injectable()
export class OrderController {
  constructor(
    @inject(USE_CASE_SYMBOLS.CreateOrderUseCase)
    private readonly createUseCase: CreateOrderUseCase,
    @inject(USE_CASE_SYMBOLS.ListOrdersUseCase)
    private readonly listUseCase: ListOrdersUseCase,
    @inject(USE_CASE_SYMBOLS.GetOrderUseCase)
    private readonly getUseCase: GetOrderUseCase,
    @inject(USE_CASE_SYMBOLS.UpdateOrderStatusUseCase)
    private readonly updateStatusUseCase: UpdateOrderStatusUseCase,
  ) {}

  public async checkout(req: Request, res: Response): Promise<void> {
    const dto = req.body as CheckoutOrderInput;
    const order = await this.createUseCase.execute({
      userId: req.user!.id,
      paymentMethod: dto.paymentMethod,
      deliveryAddress: dto.deliveryAddress,
      items: dto.items,
    });
    sendSuccess(req, res, OrderMapper.toDto(order), 201);
  }

  public async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOrdersQuery;
    const page = query.page !== undefined ? Number(query.page) : 1;
    const limit = query.limit !== undefined ? Number(query.limit) : 10;

    const result = await this.listUseCase.execute(
      { userId: query.userId, status: query.status, page, limit },
      { id: req.user!.id, role: req.user!.role },
    );

    const totalPages = Math.ceil(result.total / limit);

    sendSuccess(req, res, OrderMapper.toDtoList(result.items), 200, {
      page,
      limit,
      totalItems: result.total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  }

  public async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const order = await this.getUseCase.execute(id, { id: req.user!.id, role: req.user!.role });
    sendSuccess(req, res, OrderMapper.toDto(order), 200);
  }

  public async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const { status } = req.body as UpdateOrderStatusInput;
    const order = await this.updateStatusUseCase.execute(id, status, {
      id: req.user!.id,
      role: req.user!.role,
    });
    sendSuccess(req, res, OrderMapper.toDto(order), 200);
  }
}

export function buildOrderController(): OrderController {
  return container.resolve(OrderController);
}
