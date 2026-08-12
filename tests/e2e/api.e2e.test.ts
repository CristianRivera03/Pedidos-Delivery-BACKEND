import 'reflect-metadata';
import request from 'supertest';
import { createApp } from '@main/app';
import { container } from '@infrastructure/config/di/container';
import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { UserInMemoryRepository } from '@infrastructure/repositories/user.in-memory.repository';
import { TokenService } from '@core/services/token.service';

describe('API Endpoints (E2E Test Suite)', () => {
  let app: any;
  let inMemoryRepo: UserInMemoryRepository;
  let tokenService: TokenService;

  beforeAll(() => {
    inMemoryRepo = new UserInMemoryRepository();
    container.registerInstance(REPOSITORY_SYMBOLS.UserRepository, inMemoryRepo);
    app = createApp();
    tokenService = container.resolve<TokenService>(SERVICE_SYMBOLS.TokenService);
  });

  beforeEach(() => {
    inMemoryRepo.clear();
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
        password: 'Password123!',
        role: 'CUSTOMER',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toMatchObject({
        name: payload.name,
        email: payload.email,
        role: payload.role,
      });
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
      expect(response.body.data.user.email).toBe(payload.email);
    });

    it('debería rechazar login con contraseña incorrecta (401)', async () => {
      const payload = {
        name: 'User Test',
        email: 'user@pedidos.local',
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
});
