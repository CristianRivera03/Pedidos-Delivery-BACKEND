export const REPOSITORY_SYMBOLS = {
  UserRepository: Symbol.for('UserRepository'),
} as const;

export const SERVICE_SYMBOLS = {
  HashService: Symbol.for('HashService'),
  TokenService: Symbol.for('TokenService'),
  LoggerService: Symbol.for('LoggerService'),
  PrismaClient: Symbol.for('PrismaClient'),
} as const;

export const USE_CASE_SYMBOLS = {
  CreateUserUseCase: Symbol.for('CreateUserUseCase'),
  GetUserUseCase: Symbol.for('GetUserUseCase'),
  ListUsersUseCase: Symbol.for('ListUsersUseCase'),
  UpdateUserUseCase: Symbol.for('UpdateUserUseCase'),
  DeleteUserUseCase: Symbol.for('DeleteUserUseCase'),
} as const;
