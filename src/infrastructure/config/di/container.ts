import { container } from 'tsyringe';

import { CreateUserUseCase } from '@application/usecases/user/create-user.usecase';
import { DeleteUserUseCase } from '@application/usecases/user/delete-user.usecase';
import { GetUserUseCase } from '@application/usecases/user/get-user.usecase';
import { ListUsersUseCase } from '@application/usecases/user/list-users.usecase';
import { UpdateUserUseCase } from '@application/usecases/user/update-user.usecase';
import { LoginUseCase } from '@application/usecases/auth/login.usecase';
import { RegisterUseCase } from '@application/usecases/auth/register.usecase';
import { RefreshTokenUseCase } from '@application/usecases/auth/refresh-token.usecase';
import { LogoutUseCase } from '@application/usecases/auth/logout.usecase';

import { CreateCategoryUseCase } from '@application/usecases/category/create-category.usecase';
import { GetCategoryUseCase } from '@application/usecases/category/get-category.usecase';
import { ListCategoriesUseCase } from '@application/usecases/category/list-categories.usecase';
import { UpdateCategoryUseCase } from '@application/usecases/category/update-category.usecase';
import { DeleteCategoryUseCase } from '@application/usecases/category/delete-category.usecase';

import { CreateProductUseCase } from '@application/usecases/product/create-product.usecase';
import { GetProductUseCase } from '@application/usecases/product/get-product.usecase';
import { ListProductsUseCase } from '@application/usecases/product/list-products.usecase';
import { UpdateProductUseCase } from '@application/usecases/product/update-product.usecase';
import { DeleteProductUseCase } from '@application/usecases/product/delete-product.usecase';

import { CreateOrderUseCase } from '@application/usecases/order/create-order.usecase';
import { ListOrdersUseCase } from '@application/usecases/order/list-orders.usecase';
import { GetOrderUseCase } from '@application/usecases/order/get-order.usecase';
import { UpdateOrderStatusUseCase } from '@application/usecases/order/update-order-status.usecase';

import { PrismaClient } from '@infrastructure/database/prisma/prisma.client';
import { UserPrismaRepository } from '@infrastructure/repositories/user.prisma.repository';
import { RefreshTokenPrismaRepository } from '@infrastructure/repositories/refresh-token.prisma.repository';
import { CategoryPrismaRepository } from '@infrastructure/repositories/category.prisma.repository';
import { ProductPrismaRepository } from '@infrastructure/repositories/product.prisma.repository';
import { OrderPrismaRepository } from '@infrastructure/repositories/order.prisma.repository';
import { BcryptHashService } from '@infrastructure/services/bcrypt.hash.service';
import { JwtTokenService } from '@infrastructure/services/jwt.token.service';
import { CryptoRefreshTokenService } from '@infrastructure/services/crypto.refresh-token.service';
import { PinoLoggerService } from '@infrastructure/services/pino.logger.service';
import { FakePaymentService } from '@infrastructure/services/fake-payment.service';

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
  if (!container.isRegistered(SERVICE_SYMBOLS.RefreshTokenService)) {
    container.registerSingleton(SERVICE_SYMBOLS.RefreshTokenService, CryptoRefreshTokenService);
  }
  if (!container.isRegistered(SERVICE_SYMBOLS.LoggerService)) {
    container.registerSingleton(SERVICE_SYMBOLS.LoggerService, PinoLoggerService);
  }
  if (!container.isRegistered(SERVICE_SYMBOLS.PaymentService)) {
    container.registerSingleton(SERVICE_SYMBOLS.PaymentService, FakePaymentService);
  }

  if (!container.isRegistered(REPOSITORY_SYMBOLS.UserRepository)) {
    container.registerSingleton(REPOSITORY_SYMBOLS.UserRepository, UserPrismaRepository);
  }
  if (!container.isRegistered(REPOSITORY_SYMBOLS.RefreshTokenRepository)) {
    container.registerSingleton(REPOSITORY_SYMBOLS.RefreshTokenRepository, RefreshTokenPrismaRepository);
  }

  if (!container.isRegistered(REPOSITORY_SYMBOLS.CategoryRepository)) {
    container.registerSingleton(REPOSITORY_SYMBOLS.CategoryRepository, CategoryPrismaRepository);
  }
  if (!container.isRegistered(REPOSITORY_SYMBOLS.ProductRepository)) {
    container.registerSingleton(REPOSITORY_SYMBOLS.ProductRepository, ProductPrismaRepository);
  }
  if (!container.isRegistered(REPOSITORY_SYMBOLS.OrderRepository)) {
    container.registerSingleton(REPOSITORY_SYMBOLS.OrderRepository, OrderPrismaRepository);
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
  if (!container.isRegistered(USE_CASE_SYMBOLS.RefreshTokenUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.RefreshTokenUseCase, RefreshTokenUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.LogoutUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.LogoutUseCase, LogoutUseCase);
  }

  if (!container.isRegistered(USE_CASE_SYMBOLS.CreateCategoryUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.CreateCategoryUseCase, CreateCategoryUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.GetCategoryUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.GetCategoryUseCase, GetCategoryUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.ListCategoriesUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.ListCategoriesUseCase, ListCategoriesUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.UpdateCategoryUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.UpdateCategoryUseCase, UpdateCategoryUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.DeleteCategoryUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.DeleteCategoryUseCase, DeleteCategoryUseCase);
  }

  if (!container.isRegistered(USE_CASE_SYMBOLS.CreateProductUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.CreateProductUseCase, CreateProductUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.GetProductUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.GetProductUseCase, GetProductUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.ListProductsUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.ListProductsUseCase, ListProductsUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.UpdateProductUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.UpdateProductUseCase, UpdateProductUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.DeleteProductUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.DeleteProductUseCase, DeleteProductUseCase);
  }

  if (!container.isRegistered(USE_CASE_SYMBOLS.CreateOrderUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.CreateOrderUseCase, CreateOrderUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.ListOrdersUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.ListOrdersUseCase, ListOrdersUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.GetOrderUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.GetOrderUseCase, GetOrderUseCase);
  }
  if (!container.isRegistered(USE_CASE_SYMBOLS.UpdateOrderStatusUseCase)) {
    container.registerSingleton(USE_CASE_SYMBOLS.UpdateOrderStatusUseCase, UpdateOrderStatusUseCase);
  }
}

export { container };
