export const REPOSITORY_SYMBOLS = {
  UserRepository: Symbol.for('UserRepository'),
  RefreshTokenRepository: Symbol.for('RefreshTokenRepository'),
} as const;

export const SERVICE_SYMBOLS = {
  HashService: Symbol.for('HashService'),
  TokenService: Symbol.for('TokenService'),
  RefreshTokenService: Symbol.for('RefreshTokenService'),
  LoggerService: Symbol.for('LoggerService'),
  PrismaClient: Symbol.for('PrismaClient'),
} as const;

export const USE_CASE_SYMBOLS = {
  CreateUserUseCase: Symbol.for('CreateUserUseCase'),
  GetUserUseCase: Symbol.for('GetUserUseCase'),
  ListUsersUseCase: Symbol.for('ListUsersUseCase'),
  UpdateUserUseCase: Symbol.for('UpdateUserUseCase'),
  DeleteUserUseCase: Symbol.for('DeleteUserUseCase'),
  LoginUseCase: Symbol.for('LoginUseCase'),
  RegisterUseCase: Symbol.for('RegisterUseCase'),
  RefreshTokenUseCase: Symbol.for('RefreshTokenUseCase'),
  LogoutUseCase: Symbol.for('LogoutUseCase'),
} as const;
