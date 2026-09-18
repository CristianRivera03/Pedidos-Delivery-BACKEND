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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type App = any;

describe('Catalog & Products E2E Test Suite (RF-03 & RF-09)', () => {
  let app: App;
  let categoryRepo: CategoryInMemoryRepository;
  let productRepo: ProductInMemoryRepository;
  let tokenService: TokenService;

  let adminToken: string;
  let restaurantToken: string;
  let customerToken: string;

  beforeAll(async () => {
    categoryRepo = new CategoryInMemoryRepository();
    productRepo = new ProductInMemoryRepository();

    container.registerInstance(REPOSITORY_SYMBOLS.UserRepository, new UserInMemoryRepository());
    container.registerInstance(REPOSITORY_SYMBOLS.RefreshTokenRepository, new RefreshTokenInMemoryRepository());
    container.registerInstance(REPOSITORY_SYMBOLS.CategoryRepository, categoryRepo);
    container.registerInstance(REPOSITORY_SYMBOLS.ProductRepository, productRepo);

    app = createApp();
    tokenService = container.resolve<TokenService>(SERVICE_SYMBOLS.TokenService);

    // Tokens por rol para verificar autorización
    adminToken = tokenService.sign({ sub: '00000000-0000-0000-0000-000000000001', role: 'ADMIN' });
    restaurantToken = tokenService.sign({ sub: '00000000-0000-0000-0000-000000000002', role: 'RESTAURANT' });
    customerToken = tokenService.sign({ sub: '00000000-0000-0000-0000-000000000003', role: 'CUSTOMER' });
  });

  beforeEach(() => {
    categoryRepo.clear();
    productRepo.clear();
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // CATEGORÍAS — CRUD COMPLETO
  // ──────────────────────────────────────────────────────────────────────────────
  describe('Categorías — CRUD', () => {
    // ── CREATE ──────────────────────────────────────────────────────────────────
    describe('POST /categories', () => {
      it('ADMIN puede crear una categoría con datos válidos (201)', async () => {
        const res = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Pizzas', description: 'Pizzas artesanales' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.statusCode).toBe(201);
        expect(res.body.data.name).toBe('Pizzas');
        expect(res.body.data.description).toBe('Pizzas artesanales');
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.isActive).toBe(true);
        // Timestamp en zona horaria El Salvador (UTC-6)
        expect(res.body.data.createdAt).toMatch(/-06:00$/);
      });

      it('RESTAURANT puede crear una categoría (201)', async () => {
        const res = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${restaurantToken}`)
          .send({ name: 'Bebidas' });

        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe('Bebidas');
      });

      it('rechaza creación sin token de autenticación (401)', async () => {
        const res = await request(app)
          .post('/api/v1/categories')
          .send({ name: 'Sin Auth' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('rechaza creación con rol CUSTOMER (403)', async () => {
        const res = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ name: 'Comida' });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });

      it('rechaza nombre duplicado (409 Conflict)', async () => {
        await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Postres' });

        const res = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Postres' });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
      });

      it('rechaza nombre vacío o muy corto (400)', async () => {
        const res = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'A' }); // min 2 caracteres

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    // ── LIST ────────────────────────────────────────────────────────────────────
    describe('GET /categories', () => {
      it('lista categorías públicamente sin token (200)', async () => {
        await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Ensaladas' });

        const res = await request(app).get('/api/v1/categories');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].name).toBe('Ensaladas');
      });

      it('devuelve lista vacía si no hay categorías (200)', async () => {
        const res = await request(app).get('/api/v1/categories');

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
      });
    });

    // ── GET BY ID ───────────────────────────────────────────────────────────────
    describe('GET /categories/:id', () => {
      it('obtiene una categoría por ID públicamente (200)', async () => {
        const createRes = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Sopas', description: 'Sopas y caldos' });

        const categoryId = createRes.body.data.id;

        const res = await request(app).get(`/api/v1/categories/${categoryId}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(categoryId);
        expect(res.body.data.name).toBe('Sopas');
        expect(res.body.data.description).toBe('Sopas y caldos');
      });

      it('retorna 404 si la categoría no existe', async () => {
        const res = await request(app).get('/api/v1/categories/00000000-0000-0000-0000-000000000099');

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });
    });

    // ── UPDATE ──────────────────────────────────────────────────────────────────
    describe('PATCH /categories/:id', () => {
      it('ADMIN puede actualizar nombre y descripción (200)', async () => {
        const createRes = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Mariscos' });

        const categoryId = createRes.body.data.id;

        const res = await request(app)
          .patch(`/api/v1/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Mariscos Frescos', description: 'Pescados y mariscos del día' });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('Mariscos Frescos');
        expect(res.body.data.description).toBe('Pescados y mariscos del día');
      });

      it('puede desactivar una categoría con isActive: false (200)', async () => {
        const createRes = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Temporada' });

        const categoryId = createRes.body.data.id;

        const res = await request(app)
          .patch(`/api/v1/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isActive: false });

        expect(res.status).toBe(200);
        expect(res.body.data.isActive).toBe(false);
      });

      it('rechaza actualización sin token (401)', async () => {
        const createRes = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Test Auth' });

        const categoryId = createRes.body.data.id;

        const res = await request(app)
          .patch(`/api/v1/categories/${categoryId}`)
          .send({ name: 'Sin Token' });

        expect(res.status).toBe(401);
      });

      it('retorna 404 al actualizar categoría inexistente', async () => {
        const res = await request(app)
          .patch('/api/v1/categories/00000000-0000-0000-0000-000000000099')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'No existe' });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });
    });

    // ── DELETE ──────────────────────────────────────────────────────────────────
    describe('DELETE /categories/:id', () => {
      it('ADMIN puede eliminar una categoría (204 No Content)', async () => {
        const createRes = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Para Eliminar' });

        const categoryId = createRes.body.data.id;

        const deleteRes = await request(app)
          .delete(`/api/v1/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteRes.status).toBe(204);

        // Verificar que ya no existe
        const getRes = await request(app).get(`/api/v1/categories/${categoryId}`);
        expect(getRes.status).toBe(404);
      });

      it('rechaza eliminación sin token (401)', async () => {
        const createRes = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'No Borrar' });

        const categoryId = createRes.body.data.id;

        const res = await request(app).delete(`/api/v1/categories/${categoryId}`);

        expect(res.status).toBe(401);
      });

      it('retorna 404 al eliminar categoría inexistente', async () => {
        const res = await request(app)
          .delete('/api/v1/categories/00000000-0000-0000-0000-000000000099')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // PRODUCTOS — CRUD COMPLETO + FILTROS + VALIDACIONES DE DOMINIO
  // ──────────────────────────────────────────────────────────────────────────────
  describe('Productos — CRUD, Filtros y Validaciones de Dominio', () => {
    let categoryId: string;
    let categoryId2: string;

    beforeEach(async () => {
      // Crear dos categorías base para los tests de productos
      const cat1 = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Comida Rápida' });
      categoryId = cat1.body.data.id;

      const cat2 = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bebidas' });
      categoryId2 = cat2.body.data.id;
    });

    // ── CREATE ──────────────────────────────────────────────────────────────────
    describe('POST /products', () => {
      it('ADMIN puede crear un producto con datos válidos (201)', async () => {
        const res = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            categoryId,
            name: 'Hamburguesa Doble',
            description: 'Carne 100% res con queso',
            price: 7.99,
            stock: 50,
            imageUrl: 'https://ejemplo.com/hamburguesa.jpg',
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.statusCode).toBe(201);
        expect(res.body.data.name).toBe('Hamburguesa Doble');
        expect(res.body.data.price).toBe(7.99);
        expect(res.body.data.stock).toBe(50);
        expect(res.body.data.categoryId).toBe(categoryId);
        expect(res.body.data.isActive).toBe(true);
        // Timestamp en zona horaria El Salvador
        expect(res.body.data.createdAt).toMatch(/-06:00$/);
      });

      it('RESTAURANT puede crear un producto (201)', async () => {
        const res = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${restaurantToken}`)
          .send({ categoryId, name: 'Taco', price: 2.5, stock: 100 });

        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe('Taco');
      });

      it('rechaza creación sin token de autenticación (401)', async () => {
        const res = await request(app)
          .post('/api/v1/products')
          .send({ categoryId, name: 'Sin Auth', price: 5.0, stock: 10 });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('rechaza creación con rol CUSTOMER (403)', async () => {
        const res = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ categoryId, name: 'No autorizado', price: 5.0, stock: 10 });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });

      it('rechaza producto con precio igual a 0 (400 — precio > 0)', async () => {
        const res = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Gratis', price: 0, stock: 10 });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('rechaza producto con precio negativo (400 — precio > 0)', async () => {
        const res = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Negativo', price: -3.5, stock: 10 });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('rechaza producto con stock negativo (400 — stock >= 0)', async () => {
        const res = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Sin Stock', price: 4.5, stock: -5 });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('acepta stock igual a 0 como válido (201)', async () => {
        const res = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Agotado', price: 9.99, stock: 0 });

        expect(res.status).toBe(201);
        expect(res.body.data.stock).toBe(0);
      });

      it('retorna 404 si la categoría del producto no existe', async () => {
        const res = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            categoryId: '00000000-0000-0000-0000-000000000099',
            name: 'Categoría Inexistente',
            price: 5.0,
            stock: 10,
          });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });
    });

    // ── LIST ────────────────────────────────────────────────────────────────────
    describe('GET /products', () => {
      it('lista todos los productos públicamente sin token (200)', async () => {
        await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Papas Fritas', price: 2.5, stock: 30 });

        await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId: categoryId2, name: 'Agua Natural', price: 1.0, stock: 200 });

        const res = await request(app).get('/api/v1/products');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(2);
      });

      it('filtra productos por categoryId (200)', async () => {
        await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Hamburguesa Simple', price: 4.5, stock: 20 });

        await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId: categoryId2, name: 'Jugo de Naranja', price: 1.5, stock: 50 });

        const res = await request(app).get(`/api/v1/products?categoryId=${categoryId}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].name).toBe('Hamburguesa Simple');
        expect(res.body.data[0].categoryId).toBe(categoryId);
      });

      it('filtra productos por búsqueda de texto con ?search= (200)', async () => {
        await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Pizza Margarita', price: 8.5, stock: 15 });

        await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Pizza Pepperoni', price: 9.5, stock: 10 });

        await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId: categoryId2, name: 'Refresco Cola', price: 1.0, stock: 100 });

        const res = await request(app).get('/api/v1/products?search=pizza');

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(2);
        expect(res.body.data.every((p: { name: string }) => p.name.toLowerCase().includes('pizza'))).toBe(true);
      });

      it('filtra por categoryId y search simultáneamente (200)', async () => {
        await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Hamburguesa BBQ', price: 9.0, stock: 12 });

        await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId: categoryId2, name: 'Hamburguesa Líquida', price: 3.5, stock: 50 });

        const res = await request(app).get(`/api/v1/products?categoryId=${categoryId}&search=hamburguesa`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].name).toBe('Hamburguesa BBQ');
      });

      it('devuelve lista vacía si no hay productos (200)', async () => {
        const res = await request(app).get('/api/v1/products');

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
        expect(res.body.pagination).toEqual({
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      });

      it('soporta paginación con ?page= y ?limit= con metadata completa (200)', async () => {
        for (let i = 1; i <= 5; i++) {
          await request(app)
            .post('/api/v1/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ categoryId, name: `Producto Pag ${i}`, price: 1.0 + i, stock: 10 });
        }

        // Página 1 con límite 2
        const resPage1 = await request(app).get('/api/v1/products?page=1&limit=2');
        expect(resPage1.status).toBe(200);
        expect(resPage1.body.data.length).toBe(2);
        expect(resPage1.body.pagination).toEqual({
          page: 1,
          limit: 2,
          totalItems: 5,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: false,
        });

        // Página 3 (última página, 1 elemento)
        const resPage3 = await request(app).get('/api/v1/products?page=3&limit=2');
        expect(resPage3.status).toBe(200);
        expect(resPage3.body.data.length).toBe(1);
        expect(resPage3.body.pagination.page).toBe(3);
        expect(resPage3.body.pagination.hasNextPage).toBe(false);
        expect(resPage3.body.pagination.hasPreviousPage).toBe(true);
      });
    });


    // ── GET BY ID ───────────────────────────────────────────────────────────────
    describe('GET /products/:id', () => {
      it('obtiene un producto por ID públicamente (200)', async () => {
        const createRes = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Hot Dog', price: 3.0, stock: 25 });

        const productId = createRes.body.data.id;

        const res = await request(app).get(`/api/v1/products/${productId}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(productId);
        expect(res.body.data.name).toBe('Hot Dog');
        expect(res.body.data.price).toBe(3.0);
        expect(res.body.data.stock).toBe(25);
      });

      it('retorna 404 si el producto no existe', async () => {
        const res = await request(app).get('/api/v1/products/00000000-0000-0000-0000-000000000099');

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });
    });

    // ── UPDATE ──────────────────────────────────────────────────────────────────
    describe('PATCH /products/:id', () => {
      it('ADMIN puede actualizar nombre, precio y stock (200)', async () => {
        const createRes = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Sandwich', price: 4.0, stock: 15 });

        const productId = createRes.body.data.id;

        const res = await request(app)
          .patch(`/api/v1/products/${productId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Club Sandwich', price: 4.5, stock: 20 });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('Club Sandwich');
        expect(res.body.data.price).toBe(4.5);
        expect(res.body.data.stock).toBe(20);
      });

      it('puede cambiar la categoría del producto (200)', async () => {
        const createRes = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Producto Mover', price: 5.0, stock: 10 });

        const productId = createRes.body.data.id;

        const res = await request(app)
          .patch(`/api/v1/products/${productId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId: categoryId2 });

        expect(res.status).toBe(200);
        expect(res.body.data.categoryId).toBe(categoryId2);
      });

      it('puede desactivar un producto con isActive: false (200)', async () => {
        const createRes = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Descontinuado', price: 3.0, stock: 5 });

        const productId = createRes.body.data.id;

        const res = await request(app)
          .patch(`/api/v1/products/${productId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isActive: false });

        expect(res.status).toBe(200);
        expect(res.body.data.isActive).toBe(false);
      });

      it('rechaza actualización sin token (401)', async () => {
        const createRes = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Sin Auth Update', price: 5.0, stock: 10 });

        const productId = createRes.body.data.id;

        const res = await request(app)
          .patch(`/api/v1/products/${productId}`)
          .send({ price: 6.0 });

        expect(res.status).toBe(401);
      });

      it('rechaza precio <= 0 en actualización (400)', async () => {
        const createRes = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Precio Inválido', price: 5.0, stock: 10 });

        const productId = createRes.body.data.id;

        const res = await request(app)
          .patch(`/api/v1/products/${productId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: 0 });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('retorna 404 al actualizar producto inexistente', async () => {
        const res = await request(app)
          .patch('/api/v1/products/00000000-0000-0000-0000-000000000099')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: 9.99 });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });
    });

    // ── DELETE ──────────────────────────────────────────────────────────────────
    describe('DELETE /products/:id', () => {
      it('ADMIN puede eliminar un producto (204 No Content)', async () => {
        const createRes = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Para Eliminar', price: 3.0, stock: 10 });

        const productId = createRes.body.data.id;

        const deleteRes = await request(app)
          .delete(`/api/v1/products/${productId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteRes.status).toBe(204);

        // Verificar que ya no existe
        const getRes = await request(app).get(`/api/v1/products/${productId}`);
        expect(getRes.status).toBe(404);
      });

      it('rechaza eliminación sin token (401)', async () => {
        const createRes = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'No Borrar', price: 3.0, stock: 5 });

        const productId = createRes.body.data.id;

        const res = await request(app).delete(`/api/v1/products/${productId}`);

        expect(res.status).toBe(401);
      });

      it('rechaza eliminación con rol CUSTOMER (403)', async () => {
        const createRes = await request(app)
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId, name: 'Protegido', price: 3.0, stock: 5 });

        const productId = createRes.body.data.id;

        const res = await request(app)
          .delete(`/api/v1/products/${productId}`)
          .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).toBe(403);
      });

      it('retorna 404 al eliminar producto inexistente', async () => {
        const res = await request(app)
          .delete('/api/v1/products/00000000-0000-0000-0000-000000000099')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });
    });
  });
});
