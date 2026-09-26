export const REPOSITORY_SYMBOLS = {
  UserRepository: Symbol.for('UserRepository'),
  RefreshTokenRepository: Symbol.for('RefreshTokenRepository'),
  CategoryRepository: Symbol.for('CategoryRepository'),
  ProductRepository: Symbol.for('ProductRepository'),
  OrderRepository: Symbol.for('OrderRepository'),
} as const;

export const SERVICE_SYMBOLS = {
  HashService: Symbol.for('HashService'),
  TokenService: Symbol.for('TokenService'),
  RefreshTokenService: Symbol.for('RefreshTokenService'),
  LoggerService: Symbol.for('LoggerService'),
  PrismaClient: Symbol.for('PrismaClient'),
  PaymentService: Symbol.for('PaymentService'),
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
  CreateCategoryUseCase: Symbol.for('CreateCategoryUseCase'),
  GetCategoryUseCase: Symbol.for('GetCategoryUseCase'),
  ListCategoriesUseCase: Symbol.for('ListCategoriesUseCase'),
  UpdateCategoryUseCase: Symbol.for('UpdateCategoryUseCase'),
  DeleteCategoryUseCase: Symbol.for('DeleteCategoryUseCase'),
  CreateProductUseCase: Symbol.for('CreateProductUseCase'),
  GetProductUseCase: Symbol.for('GetProductUseCase'),
  ListProductsUseCase: Symbol.for('ListProductsUseCase'),
  UpdateProductUseCase: Symbol.for('UpdateProductUseCase'),
  DeleteProductUseCase: Symbol.for('DeleteProductUseCase'),
  CreateOrderUseCase: Symbol.for('CreateOrderUseCase'),
  ListOrdersUseCase: Symbol.for('ListOrdersUseCase'),
  GetOrderUseCase: Symbol.for('GetOrderUseCase'),
  UpdateOrderStatusUseCase: Symbol.for('UpdateOrderStatusUseCase'),
} as const;
