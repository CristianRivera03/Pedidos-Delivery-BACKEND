import { inject, injectable } from 'tsyringe';

import { User } from '@core/entities/user.entity';
import { NotFoundError } from '@core/errors/not-found.error';
import { UserRepository } from '@core/repositories/user.repository';

import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class GetUserUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  public async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    return user;
  }
}
