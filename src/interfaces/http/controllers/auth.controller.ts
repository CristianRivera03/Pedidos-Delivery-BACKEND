import { Request, Response } from 'express';
import { container, inject, injectable } from 'tsyringe';

import { LoginUseCase } from '@application/usecases/auth/login.usecase';
import { RegisterUseCase } from '@application/usecases/auth/register.usecase';
import { RefreshTokenUseCase } from '@application/usecases/auth/refresh-token.usecase';
import { LogoutUseCase } from '@application/usecases/auth/logout.usecase';
import { UserMapper } from '@application/mappers/user.mapper';
import { LoginInput, RefreshTokenInput, RegisterInput } from '@interfaces/http/validators/auth.validator';
import { USE_CASE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { sendSuccess } from '@interfaces/http/responses/response.util';

@injectable()
export class AuthController {
  constructor(
    @inject(USE_CASE_SYMBOLS.RegisterUseCase) private readonly registerUseCase: RegisterUseCase,
    @inject(USE_CASE_SYMBOLS.LoginUseCase) private readonly loginUseCase: LoginUseCase,
    @inject(USE_CASE_SYMBOLS.RefreshTokenUseCase)
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @inject(USE_CASE_SYMBOLS.LogoutUseCase) private readonly logoutUseCase: LogoutUseCase,
  ) {}

  public async register(req: Request, res: Response): Promise<void> {
    const dto = req.body as RegisterInput;
    const { user, token, refreshToken } = await this.registerUseCase.execute(dto);
    sendSuccess(req, res, { token, refreshToken, user: UserMapper.toDto(user) }, 201);
  }

  public async login(req: Request, res: Response): Promise<void> {
    const dto = req.body as LoginInput;
    const { user, token, refreshToken } = await this.loginUseCase.execute(dto);
    sendSuccess(req, res, { token, refreshToken, user: UserMapper.toDto(user) }, 200);
  }

  public async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as RefreshTokenInput;
    const result = await this.refreshTokenUseCase.execute(refreshToken);
    sendSuccess(
      req,
      res,
      {
        token: result.token,
        refreshToken: result.refreshToken,
        user: UserMapper.toDto(result.user),
      },
      200,
    );
  }

  public async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as RefreshTokenInput;
    await this.logoutUseCase.execute(refreshToken);
    sendSuccess(req, res, { message: 'Logged out successfully' }, 200);
  }
}

export function buildAuthController(): AuthController {
  return container.resolve(AuthController);
}
