# Patrones para nuevos recursos

Guía paso a paso para agregar un nuevo módulo (ej: `Order`, `Product`, `Customer`).

## Paso 1: Definir el modelo en Prisma

`prisma/schema.prisma`:

```prisma
model Order {
  id          String      @id @default(uuid()) @db.Uuid
  customerId  String      @map("customer_id") @db.Uuid
  status      OrderStatus @default(PENDING)
  total       Decimal     @db.Decimal(10, 2)
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  customer   Customer    @relation(fields: [customerId], references: [id])
  items      OrderItem[]

  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  DELIVERED
  CANCELLED
}
```

```bash
npm run prisma:migrate -- --name add_orders
```

## Paso 2: Crear Entity en `core/`

`src/core/entities/order.entity.ts`:

```ts
import { Uuid } from '@core/value-objects/uuid.value-object';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

export interface OrderProps {
  id: Uuid;
  customerId: Uuid;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  constructor(private readonly props: OrderProps) {}

  public getId(): Uuid { return this.props.id; }
  public getCustomerId(): Uuid { return this.props.customerId; }
  public getStatus(): OrderStatus { return this.props.status; }
  public getTotal(): number { return this.props.total; }

  public confirm(): void {
    if (this.props.status !== 'PENDING') {
      throw new Error(`Cannot confirm order in status ${this.props.status}`);
    }
    this.props.status = 'CONFIRMED';
    this.props.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.props.status === 'DELIVERED') {
      throw new Error('Cannot cancel a delivered order');
    }
    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }
}
```

**Si requiere validación compleja**, agrega `value-objects` (ej: `Money`).

## Paso 3: Repository interface en `core/`

`src/core/repositories/order.repository.ts`:

```ts
import { Order } from '@core/entities/order.entity';

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  findAll(): Promise<Order[]>;
  create(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
  delete(id: string): Promise<void>;
}
```

## Paso 4: Use cases en `application/`

`src/application/usecases/order/create-order.usecase.ts`:

```ts
import { inject, injectable } from 'tsyringe';

import { Order } from '@core/entities/order.entity';
import { OrderRepository } from '@core/repositories/order.repository';
import { Uuid } from '@core/value-objects/uuid.value-object';

import { CreateOrderDto } from '@application/dto/create-order.dto';

import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class CreateOrderUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.OrderRepository) private readonly orderRepository: OrderRepository,
  ) {}

  public async execute(dto: CreateOrderDto): Promise<Order> {
    const now = new Date();
    const order = new Order({
      id: new Uuid(),
      customerId: new Uuid(dto.customerId),
      status: 'PENDING',
      total: dto.total,
      createdAt: now,
      updatedAt: now,
    });
    return this.orderRepository.create(order);
  }
}
```

Repetir para `get-order`, `list-orders`, `update-order`, `delete-order`, `confirm-order`, `cancel-order`.

## Paso 5: DTOs en `application/`

`src/application/dto/create-order.dto.ts`:

```ts
export interface CreateOrderDto {
  customerId: string;
  items: { productId: string; quantity: number; price: number }[];
  // ...
}

export interface UpdateOrderDto {
  status?: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
}
```

`src/application/dto/order-response.dto.ts`:

```ts
export interface OrderResponseDto {
  id: string;
  customerId: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
}
```

## Paso 6: Mapper en `application/`

`src/application/mappers/order.mapper.ts`:

```ts
import { Order } from '@core/entities/order.entity';
import { OrderResponseDto } from '@application/dto/order-response.dto';

export class OrderMapper {
  public static toDto(order: Order): OrderResponseDto {
    return {
      id: order.getId().getValue(),
      customerId: order.getCustomerId().getValue(),
      status: order.getStatus(),
      total: order.getTotal(),
      createdAt: order.getCreatedAt().toISOString(),
      updatedAt: order.getUpdatedAt().toISOString(),
    };
  }
}
```

## Paso 7: Mapper Prisma en `infrastructure/`

`src/infrastructure/database/prisma/order.prisma.mapper.ts`:

```ts
import { Order, OrderStatus } from '@core/entities/order.entity';
import { Order as PrismaOrder } from '@prisma/client';
import { Uuid } from '@core/value-objects/uuid.value-object';

export class OrderPrismaMapper {
  public static toDomain(raw: PrismaOrder): Order {
    return new Order({
      id: new Uuid(raw.id),
      customerId: new Uuid(raw.customerId),
      status: raw.status as OrderStatus,
      total: Number(raw.total),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public static toPersistence(order: Order) {
    return {
      id: order.getId().getValue(),
      customerId: order.getCustomerId().getValue(),
      status: order.getStatus(),
      total: order.getTotal(),
      createdAt: order.getCreatedAt(),
      updatedAt: order.getUpdatedAt(),
    };
  }
}
```

## Paso 8: Repository impl en `infrastructure/`

`src/infrastructure/repositories/order.prisma.repository.ts`:

```ts
import { inject, injectable } from 'tsyringe';

import { Order } from '@core/entities/order.entity';
import { OrderRepository } from '@core/repositories/order.repository';

import { PrismaClient } from '@infrastructure/database/prisma/prisma.client';
import { OrderPrismaMapper } from '@infrastructure/database/prisma/order.prisma.mapper';

import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class OrderPrismaRepository implements OrderRepository {
  constructor(
    @inject(SERVICE_SYMBOLS.PrismaClient) private readonly prisma: PrismaClient,
  ) {}

  public async findById(id: string): Promise<Order | null> {
    const raw = await this.prisma.order.findUnique({ where: { id } });
    return raw ? OrderPrismaMapper.toDomain(raw) : null;
  }

  // ... demás métodos
}
```

## Paso 9: Symbols DI

`src/infrastructure/config/di/symbols.ts`:

```ts
export const REPOSITORY_SYMBOLS = {
  UserRepository: Symbol.for('UserRepository'),
  OrderRepository: Symbol.for('OrderRepository'),  // ← nuevo
} as const;

export const USE_CASE_SYMBOLS = {
  CreateUserUseCase: Symbol.for('CreateUserUseCase'),
  // ...
  CreateOrderUseCase: Symbol.for('CreateOrderUseCase'),  // ← nuevo
  GetOrderUseCase: Symbol.for('GetOrderUseCase'),
  // ...
} as const;
```

## Paso 10: Registrar en container

`src/infrastructure/config/di/container.ts`:

```ts
import { OrderPrismaRepository } from '@infrastructure/repositories/order.prisma.repository';
import { CreateOrderUseCase } from '@application/usecases/order/create-order.usecase';
// ...

export function registerDependencies(): void {
  // ...

  container.registerSingleton(REPOSITORY_SYMBOLS.OrderRepository, OrderPrismaRepository);
  container.registerSingleton(USE_CASE_SYMBOLS.CreateOrderUseCase, CreateOrderUseCase);
  // ...
}
```

## Paso 11: Validators en `interfaces/`

`src/interfaces/http/validators/order.validator.ts`:

```ts
import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })).min(1),
  }),
});

// ... updateOrderSchema, orderIdParamSchema
```

## Paso 12: Controller en `interfaces/`

`src/interfaces/http/controllers/order.controller.ts`:

```ts
@injectable()
export class OrderController {
  constructor(
    @inject(USE_CASE_SYMBOLS.CreateOrderUseCase) private readonly createUseCase: CreateOrderUseCase,
    @inject(USE_CASE_SYMBOLS.GetOrderUseCase) private readonly getUseCase: GetOrderUseCase,
    // ...
  ) {}

  public async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateOrderInput;
    const order = await this.createUseCase.execute(dto);
    res.status(201).json({ success: true, data: OrderMapper.toDto(order) });
  }

  // ... demás handlers
}

export function buildOrderController(): OrderController {
  return container.resolve(OrderController);
}
```

## Paso 13: Routes en `interfaces/`

`src/interfaces/http/routes/order.routes.ts`:

```ts
export function buildOrderRoutes(controller: OrderController = buildOrderController()): Router {
  const router = Router();

  router.get('/', async (req, res) => controller.list(req, res));
  router.post('/', validate(createOrderSchema, 'body'), async (req, res) => controller.create(req, res));
  router.get('/:id', validate(orderIdParamSchema, 'params'), async (req, res) => controller.getById(req, res));
  router.patch('/:id', validateAll(updateOrderSchema), async (req, res) => controller.update(req, res));
  router.delete('/:id', validate(orderIdParamSchema, 'params'), async (req, res) => controller.delete(req, res));

  return router;
}
```

Y en `src/interfaces/http/routes/index.ts`:

```ts
router.use('/orders', buildOrderRoutes());
```

## Resumen

Para cada recurso:

1. ✅ `prisma/schema.prisma` → migración
2. ✅ `core/entities/`
3. ✅ `core/repositories/` (interface)
4. ✅ `application/dto/`
5. ✅ `application/mappers/`
6. ✅ `application/usecases/<recurso>/`
7. ✅ `infrastructure/database/prisma/<recurso>.prisma.mapper.ts`
8. ✅ `infrastructure/repositories/<recurso>.prisma.repository.ts`
9. ✅ `infrastructure/config/di/symbols.ts`
10. ✅ `infrastructure/config/di/container.ts`
11. ✅ `interfaces/http/validators/<recurso>.validator.ts`
12. ✅ `interfaces/http/controllers/<recurso>.controller.ts`
13. ✅ `interfaces/http/routes/<recurso>.routes.ts`
14. ✅ `interfaces/http/routes/index.ts` (registrar)

13 archivos por recurso (5 use cases). Repetible, predecible, mantenible.
