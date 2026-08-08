import { inject, injectable } from 'tsyringe';

import { TokenService } from '@core/services/token.service';
import { LoggerService } from '@core/services/logger.service';

import { CreateUserDto } from '@application/dto/create-user.dto';
import { AuthTokenPayload } from '@application/dto/auth-token.dto';
import { CreateUserUseCase } from '@application/usecases/user/create-user.usecase';

import { SERVICE_SYMBOLS, USE_CASE_SYMBOLS } from '@infrastructure/config/di/symbols';

import { AuthResult } from './login.usecase';

@injectable()
export class RegisterUseCase {
  constructor(
    @inject(USE_CASE_SYMBOLS.CreateUserUseCase)
    private readonly createUserUseCase: CreateUserUseCase,
    @inject(SERVICE_SYMBOLS.TokenService)
    private readonly tokenService: TokenService,
    @inject(SERVICE_SYMBOLS.LoggerService)
    private readonly logger: LoggerService,
  ) {}

  public async execute(dto: CreateUserDto): Promise<AuthResult> {
    const user = await this.createUserUseCase.execute(dto);

    const payload: AuthTokenPayload = {
      sub: user.getId().getValue(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
    };
    const token = this.tokenService.sign(payload);

    this.logger.info('User registered', { userId: user.getId().getValue() });
    return { user, token };
  }
}
