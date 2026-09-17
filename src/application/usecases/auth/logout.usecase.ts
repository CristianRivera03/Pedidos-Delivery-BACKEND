import { inject, injectable } from 'tsyringe';

import { RefreshTokenRepository } from '@core/repositories/refresh-token.repository';
import { LoggerService } from '@core/services/logger.service';
import { RefreshTokenService } from '@core/services/refresh-token.service';

import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class LogoutUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(SERVICE_SYMBOLS.RefreshTokenService)
    private readonly refreshTokenService: RefreshTokenService,
    @inject(SERVICE_SYMBOLS.LoggerService)
    private readonly logger: LoggerService,
  ) {}

  public async execute(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.refreshTokenService.hash(rawRefreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (stored && !stored.isRevoked()) {
      await this.refreshTokenRepository.revoke(stored.getId().getValue());
      this.logger.info('User logged out', { userId: stored.getUserId() });
    }
  }
}
