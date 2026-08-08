import { inject, injectable } from 'tsyringe';

import { User } from '@core/entities/user.entity';
import { UnauthorizedError } from '@core/errors/unauthorized.error';
import { UserRepository } from '@core/repositories/user.repository';
import { HashService } from '@core/services/hash.service';
import { LoggerService } from '@core/services/logger.service';
import { TokenService } from '@core/services/token.service';

import { AuthTokenPayload, LoginDto } from '@application/dto/auth-token.dto';

import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

export interface AuthResult {
  user: User;
  token: string;
}

@injectable()
export class LoginUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(SERVICE_SYMBOLS.HashService)
    private readonly hashService: HashService,
    @inject(SERVICE_SYMBOLS.TokenService)
    private readonly tokenService: TokenService,
    @inject(SERVICE_SYMBOLS.LoggerService)
    private readonly logger: LoggerService,
  ) {}

  public async execute(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(dto.email.toLowerCase());
    if (!user || !user.isActive()) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const passwordMatches = await this.hashService.compare(dto.password, user.getPasswordHash());
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload: AuthTokenPayload = {
      sub: user.getId().getValue(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
    };
    const token = this.tokenService.sign(payload);

    this.logger.info('User logged in', { userId: user.getId().getValue() });
    return { user, token };
  }
}
