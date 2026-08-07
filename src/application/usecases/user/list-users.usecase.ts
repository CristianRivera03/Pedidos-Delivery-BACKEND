import { inject, injectable } from 'tsyringe';

import { User } from '@core/entities/user.entity';
import { UserRepository } from '@core/repositories/user.repository';

import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class ListUsersUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  public async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
