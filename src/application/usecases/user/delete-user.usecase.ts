import { inject, injectable } from 'tsyringe';

import { NotFoundError } from '@core/errors/not-found.error';
import { UserRepository } from '@core/repositories/user.repository';
import { LoggerService } from '@core/services/logger.service';

import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class DeleteUserUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(SERVICE_SYMBOLS.LoggerService)
    private readonly logger: LoggerService,
  ) {}

  public async execute(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    await this.userRepository.delete(id);
    this.logger.info('User deleted', { userId: id });
  }
}
