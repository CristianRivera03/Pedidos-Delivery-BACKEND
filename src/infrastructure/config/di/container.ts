import { container } from 'tsyringe';

import { CreateUserUseCase } from '@application/usecases/user/create-user.usecase';
import { DeleteUserUseCase } from '@application/usecases/user/delete-user.usecase';
import { GetUserUseCase } from '@application/usecases/user/get-user.usecase';
import { ListUsersUseCase } from '@application/usecases/user/list-users.usecase';
import { UpdateUserUseCase } from '@application/usecases/user/update-user.usecase';

import { PrismaClient } from '@infrastructure/database/prisma/prisma.client';
import { UserPrismaRepository } from '@infrastructure/repositories/user.prisma.repository';
import { BcryptHashService } from '@infrastructure/services/bcrypt.hash.service';
import { JwtTokenService } from '@infrastructure/services/jwt.token.service';
import { PinoLoggerService } from '@infrastructure/services/pino.logger.service';

import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS, USE_CASE_SYMBOLS } from './symbols';

export function registerDependencies(): void {
  container.registerSingleton(SERVICE_SYMBOLS.PrismaClient, PrismaClient);

  container.registerSingleton(SERVICE_SYMBOLS.HashService, BcryptHashService);
  container.registerSingleton(SERVICE_SYMBOLS.TokenService, JwtTokenService);
  container.registerSingleton(SERVICE_SYMBOLS.LoggerService, PinoLoggerService);

  container.registerSingleton(REPOSITORY_SYMBOLS.UserRepository, UserPrismaRepository);

  container.registerSingleton(USE_CASE_SYMBOLS.CreateUserUseCase, CreateUserUseCase);
  container.registerSingleton(USE_CASE_SYMBOLS.GetUserUseCase, GetUserUseCase);
  container.registerSingleton(USE_CASE_SYMBOLS.ListUsersUseCase, ListUsersUseCase);
  container.registerSingleton(USE_CASE_SYMBOLS.UpdateUserUseCase, UpdateUserUseCase);
  container.registerSingleton(USE_CASE_SYMBOLS.DeleteUserUseCase, DeleteUserUseCase);
}

export { container };
