import 'reflect-metadata';
import request from 'supertest';
import { createApp } from '@main/app';
import { container } from '@infrastructure/config/di/container';
import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { UserInMemoryRepository } from '@infrastructure/repositories/user.in-memory.repository';
import { RefreshTokenInMemoryRepository } from '@infrastructure/repositories/refresh-token.in-memory.repository';
import { TokenService } from '@core/services/token.service';

describe('API Endpoints (E2E Test Suite)', () => {
  let app: any;
  let inMemoryRepo: UserInMemoryRepository;
  let refreshTokenInMemoryRepo: RefreshTokenInMemoryRepository;
  let tokenService: TokenService;

  beforeAll(() => {
    inMemoryRepo = new UserInMemoryRepository();
    refreshTokenInMemoryRepo = new RefreshTokenInMemoryRepository();
    container.registerInstance(REPOSITORY_SYMBOLS.UserRepository, inMemoryRepo);
    container.registerInstance(REPOSITORY_SYMBOLS.RefreshTokenRepository, refreshTokenInMemoryRepo);
    app = createApp();
    tokenService = container.resolve<TokenService>(SERVICE_SYMBOLS.TokenService);
  });

  beforeEach(() => {
    inMemoryRepo.clear();
    refreshTokenInMemoryRepo.clear();
  });

  describe('GET /health', () => {
    it('debería retornar 200 OK con el estado de la aplicación', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('app', 'pedidos-delivery-backend');
      expect(response.body).toHaveProperty('env', process.env.NODE_ENV || 'development');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const payload = {
        name: 'Usuario Ejemplo',
        email: 'ejemplo@pedidos.local',
        phone: '70001234',
        password: 'Password123!',
        role: 'CUSTOMER',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toMatchObject({
        name: payload.name,
        email: payload.email,
        role: payload.role,
      });
      expect(response.body.data.user.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}-06:00$/,
      );
      expect(response.body.data.user.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}-06:00$/,
      );
    });

    it('debería retornar 400 si los datos son inválidos', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'invalido' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('debería iniciar sesión correctamente con credenciales válidas', async () => {
      const payload = {
        name: 'Usuario Login',
        email: 'login@pedidos.local',
        phone: '70001235',
        password: 'Password123!',
        role: 'CUSTOMER',
      };

      // Registrar primero
      await request(app).post('/api/v1/auth/register').send(payload);

      // Iniciar sesión
      const response = await request(app).post('/api/v1/auth/login').send({
        email: payload.email,
        password: payload.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(payload.email);
    });

    it('debería rechazar login con contraseña incorrecta (401)', async () => {
      const payload = {
        name: 'User Test',
        email: 'user@pedidos.local',
        phone: '70001236',
        password: 'Password123!',
      };

      await request(app).post('/api/v1/auth/register').send(payload);

      const response = await request(app).post('/api/v1/auth/login').send({
        email: payload.email,
        password: 'WrongPassword!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('debería emitir un nuevo access token y rotar el refresh token', async () => {
      const payload = {
        name: 'Usuario Refresh',
        email: 'refresh@pedidos.local',
        phone: '70001240',
        password: 'Password123!',
      };

      const registerRes = await request(app).post('/api/v1/auth/register').send(payload);
      const { refreshToken } = registerRes.body.data;

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
      expect(response.body.data.user.email).toBe(payload.email);
    });

    it('debería rechazar un refresh token ya usado (rotación) con 401', async () => {
      const payload = {
        name: 'Usuario Refresh Reuso',
        email: 'refresh-reuse@pedidos.local',
        phone: '70001241',
        password: 'Password123!',
      };

      const registerRes = await request(app).post('/api/v1/auth/register').send(payload);
      const { refreshToken } = registerRes.body.data;

      await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
      const reuseResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(reuseResponse.status).toBe(401);
      expect(reuseResponse.body.success).toBe(false);
    });

    it('debería rechazar un refresh token inexistente con 401', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'a'.repeat(128) });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('debería revocar el refresh token y bloquear su reuso', async () => {
      const payload = {
        name: 'Usuario Logout',
        email: 'logout@pedidos.local',
        phone: '70001242',
        password: 'Password123!',
      };

      const registerRes = await request(app).post('/api/v1/auth/register').send(payload);
      const { refreshToken } = registerRes.body.data;

      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });
      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);

      const refreshAfterLogout = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(refreshAfterLogout.status).toBe(401);
    });
  });

  describe('GET /api/v1/users (Protected Endpoint)', () => {
    it('debería retornar 401 si no se envía token JWT', async () => {
      const response = await request(app).get('/api/v1/users');
      expect(response.status).toBe(401);
    });

    it('debería permitir al ADMIN listar usuarios', async () => {
      // Registrar usuario
      const regRes = await request(app).post('/api/v1/auth/register').send({
        name: 'Admin Global',
        email: 'admin.global@pedidos.local',
        phone: '70001237',
        password: 'AdminPassword123!',
        role: 'CUSTOMER',
      });

      const userId = regRes.body.data.user.id;
      const userObj = await inMemoryRepo.findById(userId);
      if (userObj) {
        userObj.changeRole('ADMIN');
        await inMemoryRepo.update(userObj);
      }

      // Generar token como ADMIN
      const adminToken = tokenService.sign({ sub: userId, role: 'ADMIN' });

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/users/me (Protected Endpoint)', () => {
    it('debería retornar 401 si no se envía token JWT', async () => {
      const response = await request(app).get('/api/v1/users/me');
      expect(response.status).toBe(401);
    });

    it('debería retornar el perfil del usuario autenticado', async () => {
      const payload = {
        name: 'Usuario Me',
        email: 'me@pedidos.local',
        phone: '70001238',
        password: 'Password123!',
        role: 'CUSTOMER',
      };

      const regRes = await request(app).post('/api/v1/auth/register').send(payload);
      const token = regRes.body.data.token;

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: regRes.body.data.user.id,
        email: payload.email,
        name: payload.name,
      });
      expect(response.body.data.createdAt).toMatch(/-06:00$/);
      expect(response.body.data.updatedAt).toMatch(/-06:00$/);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('conserva createdAt y avanza updatedAt al actualizar un usuario', async () => {
      const registerResponse = await request(app).post('/api/v1/auth/register').send({
        name: 'Usuario Actualizable',
        email: 'actualizable@pedidos.local',
        phone: '70001239',
        password: 'Password123!',
        role: 'CUSTOMER',
      });
      const original = registerResponse.body.data.user;
      const token = registerResponse.body.data.token;

      await new Promise((resolve) => setTimeout(resolve, 5));

      const response = await request(app)
        .patch(`/api/v1/users/${original.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Usuario Actualizado' });

      expect(response.status).toBe(200);
      expect(response.body.data.createdAt).toBe(original.createdAt);
      expect(response.body.data.updatedAt).toMatch(/-06:00$/);
      expect(new Date(response.body.data.updatedAt).getTime()).toBeGreaterThan(
        new Date(original.updatedAt).getTime(),
      );
    });
  });

  describe('POST /api/v1/auth/login - rate limiting', () => {
    it('debería bloquear con 429 tras superar el máximo de intentos permitidos', async () => {
      // App aislada: cada createApp() arma un limitador de login con su propio
      // contador, para no consumir el cupo del resto de tests de este archivo.
      const rateLimitedApp = createApp();

      const payload = {
        name: 'Usuario Rate Limit',
        email: 'ratelimit@pedidos.local',
        phone: '70001243',
        password: 'Password123!',
      };
      await request(rateLimitedApp).post('/api/v1/auth/register').send(payload);

      let lastResponse: request.Response | undefined;
      for (let i = 0; i < 10; i += 1) {
        lastResponse = await request(rateLimitedApp)
          .post('/api/v1/auth/login')
          .send({ email: payload.email, password: 'WrongPassword!' });
      }

      expect(lastResponse?.status).toBe(429);
      expect(lastResponse?.body.success).toBe(false);
      expect(lastResponse?.body.error.type).toBe('TooManyRequestsError');
    });
  });
});
