import { inject, injectable } from 'tsyringe';

import { RefreshToken } from '@core/entities/refresh-token.entity';
import { UnauthorizedError } from '@core/errors/unauthorized.error';
import { RefreshTokenRepository } from '@core/repositories/refresh-token.repository';
import { UserRepository } from '@core/repositories/user.repository';
import { LoggerService } from '@core/services/logger.service';
import { RefreshTokenService } from '@core/services/refresh-token.service';
import { TokenService } from '@core/services/token.service';
import { Uuid } from '@core/value-objects/uuid.value-object';

import { AuthTokenPayload } from '@application/dto/auth-token.dto';

import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

import { AuthResult } from './login.usecase';

@injectable()
export class RefreshTokenUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(REPOSITORY_SYMBOLS.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(SERVICE_SYMBOLS.TokenService)
    private readonly tokenService: TokenService,
    @inject(SERVICE_SYMBOLS.RefreshTokenService)
    private readonly refreshTokenService: RefreshTokenService,
    @inject(SERVICE_SYMBOLS.LoggerService)
    private readonly logger: LoggerService,
  ) {}

  public async execute(rawRefreshToken: string): Promise<AuthResult> {
    const tokenHash = this.refreshTokenService.hash(rawRefreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!stored) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (stored.isRevoked()) {
      // A revoked token being reused suggests it was stolen: kill the whole session.
      await this.refreshTokenRepository.revokeAllForUser(stored.getUserId());
      this.logger.warn('Reused refresh token detected, revoking all sessions', {
        userId: stored.getUserId(),
      });
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (stored.isExpired()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    const user = await this.userRepository.findById(stored.getUserId());
    if (!user || !user.isActive()) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    await this.refreshTokenRepository.revoke(stored.getId().getValue());

    const payload: AuthTokenPayload = {
      sub: user.getId().getValue(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
    };
    const token = this.tokenService.sign(payload);

    const rawNewRefreshToken = this.refreshTokenService.generate();
    await this.refreshTokenRepository.create(
      new RefreshToken({
        id: new Uuid(),
        userId: user.getId().getValue(),
        tokenHash: this.refreshTokenService.hash(rawNewRefreshToken),
        expiresAt: this.refreshTokenService.getExpiresAt(),
        revokedAt: null,
        createdAt: new Date(),
      }),
    );

    this.logger.info('Refresh token rotated', { userId: user.getId().getValue() });
    return { user, token, refreshToken: rawNewRefreshToken };
  }
}
