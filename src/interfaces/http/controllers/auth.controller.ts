import { Request, Response } from 'express';
import { container, inject, injectable } from 'tsyringe';

import { LoginUseCase } from '@application/usecases/auth/login.usecase';
import { RegisterUseCase } from '@application/usecases/auth/register.usecase';
import { UserMapper } from '@application/mappers/user.mapper';
import { LoginInput, RegisterInput } from '@interfaces/http/validators/auth.validator';
import { USE_CASE_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class AuthController {
  constructor(
    @inject(USE_CASE_SYMBOLS.RegisterUseCase) private readonly registerUseCase: RegisterUseCase,
    @inject(USE_CASE_SYMBOLS.LoginUseCase) private readonly loginUseCase: LoginUseCase,
  ) {}

  public async register(req: Request, res: Response): Promise<void> {
    const dto = req.body as RegisterInput;
    const { user, token } = await this.registerUseCase.execute(dto);
    res.status(201).json({ success: true, data: { token, user: UserMapper.toDto(user) } });
  }

  public async login(req: Request, res: Response): Promise<void> {
    const dto = req.body as LoginInput;
    const { user, token } = await this.loginUseCase.execute(dto);
    res.status(200).json({ success: true, data: { token, user: UserMapper.toDto(user) } });
  }
}

export function buildAuthController(): AuthController {
  return container.resolve(AuthController);
}
