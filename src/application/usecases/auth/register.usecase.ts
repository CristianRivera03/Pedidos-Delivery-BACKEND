import { inject, injectable } from 'tsyringe';

import { RefreshToken } from '@core/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@core/repositories/refresh-token.repository';
import { TokenService } from '@core/services/token.service';
import { LoggerService } from '@core/services/logger.service';
import { RefreshTokenService } from '@core/services/refresh-token.service';
import { Uuid } from '@core/value-objects/uuid.value-object';

import { CreateUserDto } from '@application/dto/create-user.dto';
import { AuthTokenPayload } from '@application/dto/auth-token.dto';
import { CreateUserUseCase } from '@application/usecases/user/create-user.usecase';

import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS, USE_CASE_SYMBOLS } from '@infrastructure/config/di/symbols';

import { AuthResult } from './login.usecase';

@injectable()
export class RegisterUseCase {
  constructor(
    @inject(USE_CASE_SYMBOLS.CreateUserUseCase)
    private readonly createUserUseCase: CreateUserUseCase,
    @inject(REPOSITORY_SYMBOLS.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(SERVICE_SYMBOLS.TokenService)
    private readonly tokenService: TokenService,
    @inject(SERVICE_SYMBOLS.RefreshTokenService)
    private readonly refreshTokenService: RefreshTokenService,
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

    const rawRefreshToken = this.refreshTokenService.generate();
    await this.refreshTokenRepository.create(
      new RefreshToken({
        id: new Uuid(),
        userId: user.getId().getValue(),
        tokenHash: this.refreshTokenService.hash(rawRefreshToken),
        expiresAt: this.refreshTokenService.getExpiresAt(),
        revokedAt: null,
        createdAt: new Date(),
      }),
    );

    this.logger.info('User registered', { userId: user.getId().getValue() });
    return { user, token, refreshToken: rawRefreshToken };
  }
}
