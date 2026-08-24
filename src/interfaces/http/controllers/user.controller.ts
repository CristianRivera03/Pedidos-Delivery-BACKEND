import { Request, Response } from 'express';
import { container, inject, injectable } from 'tsyringe';

import { CreateUserUseCase } from '@application/usecases/user/create-user.usecase';
import { DeleteUserUseCase } from '@application/usecases/user/delete-user.usecase';
import { GetUserUseCase } from '@application/usecases/user/get-user.usecase';
import { ListUsersUseCase } from '@application/usecases/user/list-users.usecase';
import { UpdateUserUseCase } from '@application/usecases/user/update-user.usecase';
import { CreateUserInput, UpdateUserInput } from '@interfaces/http/validators/user.validator';
import { USE_CASE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { UserMapper } from '@application/mappers/user.mapper';

@injectable()
export class UserController {
  constructor(
    @inject(USE_CASE_SYMBOLS.CreateUserUseCase) private readonly createUseCase: CreateUserUseCase,
    @inject(USE_CASE_SYMBOLS.GetUserUseCase) private readonly getUseCase: GetUserUseCase,
    @inject(USE_CASE_SYMBOLS.ListUsersUseCase) private readonly listUseCase: ListUsersUseCase,
    @inject(USE_CASE_SYMBOLS.UpdateUserUseCase) private readonly updateUseCase: UpdateUserUseCase,
    @inject(USE_CASE_SYMBOLS.DeleteUserUseCase) private readonly deleteUseCase: DeleteUserUseCase,
  ) {}

  public async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateUserInput;
    const user = await this.createUseCase.execute(dto);
    res.status(201).json({ success: true, data: UserMapper.toDto(user) });
  }

  public async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const user = await this.getUseCase.execute(id);
    res.status(200).json({ success: true, data: UserMapper.toDto(user) });
  }

  public async me(req: Request, res: Response): Promise<void> {
    const user = await this.getUseCase.execute(req.user!.id);
    res.status(200).json({ success: true, data: UserMapper.toDto(user) });
  }

  public async list(_req: Request, res: Response): Promise<void> {
    const users = await this.listUseCase.execute();
    res.status(200).json({ success: true, data: UserMapper.toDtoList(users) });
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const dto = req.body as UpdateUserInput;
    if (req.user?.role !== 'ADMIN') {
      delete dto.role;
    }
    const user = await this.updateUseCase.execute(id, dto);
    res.status(200).json({ success: true, data: UserMapper.toDto(user) });
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    await this.deleteUseCase.execute(id);
    res.status(204).send();
  }
}

export function buildUserController(): UserController {
  return container.resolve(UserController);
}