import 'reflect-metadata';
import request from 'supertest';
import { createApp } from '@main/app';
import { container } from '@infrastructure/config/di/container';
import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { UserInMemoryRepository } from '@infrastructure/repositories/user.in-memory.repository';
import { RefreshTokenInMemoryRepository } from '@infrastructure/repositories/refresh-token.in-memory.repository';
import { CategoryInMemoryRepository } from '@infrastructure/repositories/category.in-memory.repository';
import { ProductInMemoryRepository } from '@infrastructure/repositories/product.in-memory.repository';
import { TokenService } from '@core/services/token.service';

describe('Catalog & Products E2E Test Suite (RF-03 & RF-09)', () => {
  let app: any;
  let userRepo: UserInMemoryRepository;
  let categoryRepo: CategoryInMemoryRepository;
  let productRepo: ProductInMemoryRepository;
  let tokenService: TokenService;

  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    userRepo = new UserInMemoryRepository();
    categoryRepo = new CategoryInMemoryRepository();
    productRepo = new ProductInMemoryRepository();

    container.registerInstance(REPOSITORY_SYMBOLS.UserRepository, userRepo);
    container.registerInstance(REPOSITORY_SYMBOLS.RefreshTokenRepository, new RefreshTokenInMemoryRepository());
    container.registerInstance(REPOSITORY_SYMBOLS.CategoryRepository, categoryRepo);
    container.registerInstance(REPOSITORY_SYMBOLS.ProductRepository, productRepo);

    app = createApp();
    tokenService = container.resolve<TokenService>(SERVICE_SYMBOLS.TokenService);

    // Crear tokens para pruebas de roles
    adminToken = tokenService.sign({ sub: '00000000-0000-0000-0000-000000000001', role: 'ADMIN' });
    customerToken = tokenService.sign({ sub: '00000000-0000-0000-0000-000000000002', role: 'CUSTOMER' });
  });

  beforeEach(() => {
    categoryRepo.clear();
    productRepo.clear();
  });

  describe('Categorías CRUD', () => {
    it('debería permitir crear una categoría a un usuario ADMIN (201)', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pizzas',
          description: 'Pizzas artesanales',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.statusCode).toBe(201);
      expect(response.body.data.name).toBe('Pizzas');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.createdAt).toMatch(/-06:00$/);
    });

    it('debería rechazar la creación de categoría a un CUSTOMER (403)', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Bebidas',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('debería listar categorías públicamente sin necesidad de token (200)', async () => {
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Postres' });

      const response = await request(app).get('/api/v1/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Postres');
    });
  });

  describe('Productos CRUD & Validaciones (precio > 0 y stock >= 0)', () => {
    let categoryId: string;

    beforeEach(async () => {
      const catRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Comida Rápida' });
      categoryId = catRes.body.data.id;
    });

    it('debería crear un producto exitosamente con datos válidos (201)', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId,
          name: 'Hamburguesa Doble',
          description: 'Carne 100% res',
          price: 7.99,
          stock: 50,
          imageUrl: 'https://ejemplo.com/hamburguesa.jpg',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Hamburguesa Doble');
      expect(response.body.data.price).toBe(7.99);
      expect(response.body.data.stock).toBe(50);
      expect(response.body.data.categoryId).toBe(categoryId);
      expect(response.body.data.createdAt).toMatch(/-06:00$/);
    });

    it('debería rechazar un producto con precio <= 0 (400 Bad Request)', async () => {
      const resCero = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId,
          name: 'Producto Gratis',
          price: 0,
          stock: 10,
        });

      expect(resCero.status).toBe(400);
      expect(resCero.body.success).toBe(false);

      const resNegativo = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId,
          name: 'Producto Negativo',
          price: -3.50,
          stock: 10,
        });

      expect(resNegativo.status).toBe(400);
      expect(resNegativo.body.success).toBe(false);
    });

    it('debería rechazar un producto con stock < 0 (400 Bad Request)', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId,
          name: 'Producto Sin Stock',
          price: 4.50,
          stock: -5,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debería filtrar productos por categoría públicamente (200)', async () => {
      // Crear segundo category y dos productos
      const catRes2 = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bebidas' });
      const categoryId2 = catRes2.body.data.id;

      await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categoryId, name: 'Papas Fritas', price: 2.50, stock: 30 });

      await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categoryId: categoryId2, name: 'Gaseosa', price: 1.50, stock: 100 });

      // Filtrar por categoría 1
      const response = await request(app).get(`/api/v1/products?categoryId=${categoryId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Papas Fritas');
    });

    it('debería actualizar un producto y persistir los cambios (200)', async () => {
      const createRes = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categoryId, name: 'Sandwich', price: 4.00, stock: 15 });

      const productId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 4.50, stock: 20 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.price).toBe(4.50);
      expect(updateRes.body.data.stock).toBe(20);
    });

    it('debería eliminar un producto (204 No Content)', async () => {
      const createRes = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categoryId, name: 'Hot Dog', price: 3.00, stock: 10 });

      const productId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(204);

      const getRes = await request(app).get(`/api/v1/products/${productId}`);
      expect(getRes.status).toBe(404);
    });
  });
});
