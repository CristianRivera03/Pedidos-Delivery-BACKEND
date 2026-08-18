import { container } from 'tsyringe';

import { CreateUserUseCase } from '@application/usecases/user/create-user.usecase';
import { DeleteUserUseCase } from '@application/usecases/user/delete-user.usecase';
import { GetUserUseCase } from '@application/usecases/user/get-user.usecase';
import { ListUsersUseCase } from '@application/usecases/user/list-users.usecase';
import { UpdateUserUseCase } from '@application/usecases/user/update-user.usecase';
import { LoginUseCase } from '@application/usecases/auth/login.usecase';
import { RegisterUseCase } from '@application/usecases/auth/register.usecase';

import { PrismaClient } from '@infrastructure/database/prisma/prisma.client';
import { UserPrismaRepository } from '@infrastructure/repositories/user.prisma.repository';
import { BcryptHashService } from '@infrastructure/services/bcrypt.hash.service';
import { JwtTokenService } from '@infrastructure/services/jwt.token.service';
import { PinoLoggerService } from '@infrastructure/services/pino.logger.service';

import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS, USE_CASE_SYMBOLS } from './symbols';

export function registerDependencies(): void {
  if (!container.isRegistered(SERVICE_SYMBOLS.PrismaClient)) {
    container.registerSingleton(SERVICE_SYMBOLS.PrismaClient, PrismaClient);
  }

  if (!container.isRegistered(SERVICE_SYMBOLS.HashService)) {
    container.registerSingleton(SERVICE_SYMBOLS.HashService, BcryptHashService);
  }
  if (!container.isRegistered(SERVICE_SYMBOLS.TokenService)) {
    container.registerSingleton(SERVICE_SYMBOLS.TokenService, JwtTokenService);
  }
  if (!container.isRegistered(SERVICE_SYMBOLS.LoggerService)) {
    container.registerSingleton(SERVICE_SYMBOLS.LoggerService, PinoLoggerService);
  }

  if (!container.isRegistered(REPOSITORY_SYMBOLS.UserRepository)) {
    container.registerSingleton(REPOSITORY_SYMBOLS.UserRepository, UserPrismaRepository);
  }

  if (!container.isRegistered(USE_CASE_SYMBOLS.CreateUserUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.CreateUserUseCase, CreateUserUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.GetUserUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.GetUserUseCase, GetUserUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.ListUsersUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.ListUsersUseCase, ListUsersUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.UpdateUserUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.UpdateUserUseCase, UpdateUserUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.DeleteUserUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.DeleteUserUseCase, DeleteUserUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.LoginUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.LoginUseCase, LoginUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.RegisterUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.RegisterUseCase, RegisterUseCase);
  }
}

export { container };
