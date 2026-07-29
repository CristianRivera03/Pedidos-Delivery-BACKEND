import { inject, injectable } from 'tsyringe';

import { User } from '@core/entities/user.entity';
import { ConflictError } from '@core/errors/conflict.error';
import { UserRepository } from '@core/repositories/user.repository';
import { HashService } from '@core/services/hash.service';
import { LoggerService } from '@core/services/logger.service';
import { Email } from '@core/value-objects/email.value-object';
import { Uuid } from '@core/value-objects/uuid.value-object';

import { CreateUserDto } from '@application/dto/create-user.dto';

import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(SERVICE_SYMBOLS.HashService)
    private readonly hashService: HashService,
    @inject(SERVICE_SYMBOLS.LoggerService)
    private readonly logger: LoggerService,
  ) {}

  public async execute(dto: CreateUserDto): Promise<User> {
    const email = new Email(dto.email);

    const existing = await this.userRepository.findByEmail(email.getValue());
    if (existing) {
      throw new ConflictError(`User with email '${email.getValue()}' already exists`);
    }

    const passwordHash = await this.hashService.hash(dto.password);

    const now = new Date();
    const user = new User({
      id: new Uuid(),
      email,
      name: dto.name.trim(),
      passwordHash,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const created = await this.userRepository.create(user);
    this.logger.info('User created', { userId: created.getId().getValue() });
    return created;
  }
}
