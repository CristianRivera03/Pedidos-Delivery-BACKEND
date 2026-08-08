import { inject, injectable } from 'tsyringe';

import { User } from '@core/entities/user.entity';
import { ConflictError } from '@core/errors/conflict.error';
import { NotFoundError } from '@core/errors/not-found.error';
import { UserRepository } from '@core/repositories/user.repository';
import { HashService } from '@core/services/hash.service';
import { LoggerService } from '@core/services/logger.service';
import { Email } from '@core/value-objects/email.value-object';

import { UpdateUserDto } from '@application/dto/create-user.dto';

import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class UpdateUserUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(SERVICE_SYMBOLS.HashService)
    private readonly hashService: HashService,
    @inject(SERVICE_SYMBOLS.LoggerService)
    private readonly logger: LoggerService,
  ) {}

  public async execute(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    if (dto.email !== undefined) {
      const newEmail = new Email(dto.email);
      if (!newEmail.equals(user.getEmail())) {
        const existing = await this.userRepository.findByEmail(newEmail.getValue());
        if (existing && existing.getId().getValue() !== id) {
          throw new ConflictError(`Email '${newEmail.getValue()}' is already in use`);
        }
        user.changeEmail(newEmail);
      }
    }

    if (dto.name !== undefined) {
      user.changeName(dto.name);
    }

    if (dto.password !== undefined) {
      const passwordHash = await this.hashService.hash(dto.password);
      user.changePasswordHash(passwordHash);
    }

    if (dto.role !== undefined) {
      user.changeRole(dto.role);
    }

    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        user.activate();
      } else {
        user.deactivate();
      }
    }

    const updated = await this.userRepository.update(user);
    this.logger.info('User updated', { userId: id });
    return updated;
  }
}
