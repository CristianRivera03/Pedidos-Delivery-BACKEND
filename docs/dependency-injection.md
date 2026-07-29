# Inyección de dependencias

Usamos [`tsyringe`](https://github.com/microsoft/tsyringe) como contenedor de DI. Es liviano, usa decoradores y permite registrar implementaciones contra interfaces.

## Configuración

### 1. Habilitar decoradores

`tsconfig.json`:

```json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```

### 2. Importar reflect-metadata

Primera línea de `src/main/app.ts`:

```ts
import 'reflect-metadata';
```

## Symbols

Como TS no puede inyectar contra interfaces (no existen en runtime), usamos `Symbol` como tokens.

`src/infrastructure/config/di/symbols.ts`:

```ts
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
  // ...
} as const;
```

`Symbol.for()` crea un símbolo global accesible desde cualquier parte.

## Container

`src/infrastructure/config/di/container.ts`:

```ts
import { container } from 'tsyringe';

export function registerDependencies(): void {
  container.registerSingleton(SERVICE_SYMBOLS.PrismaClient, PrismaClient);
  container.registerSingleton(REPOSITORY_SYMBOLS.UserRepository, UserPrismaRepository);
  container.registerSingleton(USE_CASE_SYMBOLS.CreateUserUseCase, CreateUserUseCase);
  // ...
}
```

- `registerSingleton`: una sola instancia por container.
- `register`: nueva instancia cada resolución.

## Uso en clases

### Implementación (infra)

```ts
import { injectable } from 'tsyringe';

@injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(
    @inject(SERVICE_SYMBOLS.PrismaClient) private readonly prisma: PrismaClient,
  ) {}
}
```

### Use case (application)

```ts
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(REPOSITORY_SYMBOLS.UserRepository) private readonly userRepository: UserRepository,
    @inject(SERVICE_SYMBOLS.HashService) private readonly hashService: HashService,
  ) {}

  public async execute(dto: CreateUserDto): Promise<User> {
    // ...
  }
}
```

### Resolución en controller

```ts
export function buildUserController(): UserController {
  return container.resolve(UserController);
}
```

```ts
@injectable()
export class UserController {
  constructor(
    @inject(USE_CASE_SYMBOLS.CreateUserUseCase) private readonly createUseCase: CreateUserUseCase,
    // ...
  ) {}
}
```

## Orden de registro

En `registerDependencies()`:

1. Primitivos (PrismaClient).
2. Servicios (Hash, Token, Logger).
3. Repositories.
4. Use cases.

Si un use case requiere un repo no registrado, falla con mensaje claro.

## Cómo agregar una nueva dependencia

Caso: nuevo `EmailService`.

1. **Symbol** en `symbols.ts`:
   ```ts
   export const SERVICE_SYMBOLS = {
     EmailService: Symbol.for('EmailService'),
     // ...
   } as const;
   ```

2. **Interface** en `core/services/email.service.ts`:
   ```ts
   export interface EmailService {
     send(to: string, subject: string, body: string): Promise<void>;
   }
   ```

3. **Implementación** en `infrastructure/services/smtp.email.service.ts`:
   ```ts
   @injectable()
   export class SmtpEmailService implements EmailService {
     constructor(@inject(SERVICE_SYMBOLS.LoggerService) private readonly logger: LoggerService) {}
     public async send(to: string, subject: string, body: string): Promise<void> {
       // ...
     }
   }
   ```

4. **Registrar** en `container.ts`:
   ```ts
   container.registerSingleton(SERVICE_SYMBOLS.EmailService, SmtpEmailService);
   ```

5. **Usar** donde se necesite:
   ```ts
   @inject(SERVICE_SYMBOLS.EmailService) private readonly emailService: EmailService,
   ```

## Lifetime

| Tipo | Cuándo usarlo |
|---|---|
| `registerSingleton` | Repositories, Prisma, Logger (sin estado mutable por request). |
| `register` | Use cases (pueden tener state, aunque normalmente no). |
| `registerInstance` | Para pasar un valor ya creado (ej: config). |

## Testing

Para tests, se puede usar `container.registerInstance()` para reemplazar implementación:

```ts
import { container } from 'tsyringe';
import { REPOSITORY_SYMBOLS } from '@infrastructure/config/di/symbols';

const mockRepo: UserRepository = { /* ... */ };
container.registerInstance(REPOSITORY_SYMBOLS.UserRepository, mockRepo);
```

`tsyringe` también provee `reset()` para limpiar el container entre tests.
