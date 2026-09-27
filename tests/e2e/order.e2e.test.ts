import 'reflect-metadata';
import request from 'supertest';
import { createApp } from '@main/app';
import { container } from '@infrastructure/config/di/container';
import { REPOSITORY_SYMBOLS, SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { UserInMemoryRepository } from '@infrastructure/repositories/user.in-memory.repository';
import { RefreshTokenInMemoryRepository } from '@infrastructure/repositories/refresh-token.in-memory.repository';
import { CategoryInMemoryRepository } from '@infrastructure/repositories/category.in-memory.repository';
import { ProductInMemoryRepository } from '@infrastructure/repositories/product.in-memory.repository';
import { OrderInMemoryRepository } from '@infrastructure/repositories/order.in-memory.repository';
import { TokenService } from '@core/services/token.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type App = any;

describe('Orders E2E Test Suite (RF-04/05/06/10)', () => {
  let app: App;
  let productRepo: ProductInMemoryRepository;
  let categoryRepo: CategoryInMemoryRepository;
  let orderRepo: OrderInMemoryRepository;
  let tokenService: TokenService;

  let adminToken: string;
  let restaurantToken: string;
  let deliveryToken: string;
  let customerToken: string;
  let customer2Token: string;

  let categoryId: string;
  let productId: string; // stock 10, price 5.00
  let lowStockProductId: string; // stock 1, price 3.50

  beforeAll(async () => {
    categoryRepo = new CategoryInMemoryRepository();
    productRepo = new ProductInMemoryRepository();
    orderRepo = new OrderInMemoryRepository(productRepo);

    container.registerInstance(REPOSITORY_SYMBOLS.UserRepository, new UserInMemoryRepository());
    container.registerInstance(REPOSITORY_SYMBOLS.RefreshTokenRepository, new RefreshTokenInMemoryRepository());
    container.registerInstance(REPOSITORY_SYMBOLS.CategoryRepository, categoryRepo);
    container.registerInstance(REPOSITORY_SYMBOLS.ProductRepository, productRepo);
    container.registerInstance(REPOSITORY_SYMBOLS.OrderRepository, orderRepo);

    app = createApp();
    tokenService = container.resolve<TokenService>(SERVICE_SYMBOLS.TokenService);

    adminToken = tokenService.sign({ sub: '00000000-0000-0000-0000-000000000001', role: 'ADMIN' });
    restaurantToken = tokenService.sign({ sub: '00000000-0000-0000-0000-000000000002', role: 'RESTAURANT' });
    deliveryToken = tokenService.sign({ sub: '00000000-0000-0000-0000-000000000003', role: 'DELIVERY' });
    customerToken = tokenService.sign({ sub: '00000000-0000-0000-0000-000000000004', role: 'CUSTOMER' });
    customer2Token = tokenService.sign({ sub: '00000000-0000-0000-0000-000000000005', role: 'CUSTOMER' });
  });

  beforeEach(async () => {
    categoryRepo.clear();
    productRepo.clear();
    orderRepo.clear();

    const category = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Comida Rápida' });
    categoryId = category.body.data.id;

    const product = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoryId, name: 'Hamburguesa', price: 5.0, stock: 10 });
    productId = product.body.data.id;

    const lowStockProduct = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoryId, name: 'Papas Fritas', price: 3.5, stock: 1 });
    lowStockProductId = lowStockProduct.body.data.id;
  });

  const validCheckoutBody = (overrides: Record<string, unknown> = {}) => ({
    paymentMethod: 'CASH',
    deliveryAddress: 'Colonia Escalón, San Salvador',
    items: [{ productId, quantity: 2 }],
    ...overrides,
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // POST /orders — CHECKOUT
  // ──────────────────────────────────────────────────────────────────────────────
  describe('POST /orders', () => {
    it('CUSTOMER puede hacer checkout con CASH — queda PAGADO, cashCollectedAt null, stock descontado (201)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody());

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PAGADO');
      expect(res.body.data.paymentMethod).toBe('CASH');
      expect(res.body.data.cashCollectedAt).toBeNull();
      expect(res.body.data.subtotal).toBe(10);
      expect(res.body.data.taxAmount).toBe(1.3);
      expect(res.body.data.total).toBe(11.3);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].productName).toBe('Hamburguesa');

      const productRes = await request(app).get(`/api/v1/products/${productId}`);
      expect(productRes.body.data.stock).toBe(8);
    });

    it('CUSTOMER puede hacer checkout con CARD — queda PAGADO, cashCollectedAt null (201)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody({ paymentMethod: 'CARD' }));

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PAGADO');
      expect(res.body.data.paymentMethod).toBe('CARD');
      expect(res.body.data.cashCollectedAt).toBeNull();
    });

    it('calcula correctamente el IVA (13%) con múltiples líneas', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(
          validCheckoutBody({
            items: [
              { productId, quantity: 2 }, // 2 * 5.00 = 10.00
              { productId: lowStockProductId, quantity: 1 }, // 1 * 3.50 = 3.50
            ],
          }),
        );

      expect(res.status).toBe(201);
      expect(res.body.data.subtotal).toBe(13.5);
      expect(res.body.data.taxAmount).toBe(1.76);
      expect(res.body.data.total).toBe(15.26);
    });

    it('rechaza checkout sin token de autenticación (401)', async () => {
      const res = await request(app).post('/api/v1/orders').send(validCheckoutBody());
      expect(res.status).toBe(401);
    });

    it('rechaza checkout de un rol distinto a CUSTOMER (403)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCheckoutBody());
      expect(res.status).toBe(403);
    });

    it('rechaza checkout con items vacío (400)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody({ items: [] }));
      expect(res.status).toBe(400);
    });

    it('rechaza dirección de entrega demasiado corta (400)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody({ deliveryAddress: 'abc' }));
      expect(res.status).toBe(400);
    });

    it('rechaza cantidad inválida (0 o negativa) (400)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody({ items: [{ productId, quantity: 0 }] }));
      expect(res.status).toBe(400);
    });

    it('retorna 404 si algún producto no existe', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody({ items: [{ productId: '00000000-0000-0000-0000-000000009999', quantity: 1 }] }));
      expect(res.status).toBe(404);
    });

    it('retorna 409 si el stock es insuficiente y NO descuenta el stock existente', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody({ items: [{ productId: lowStockProductId, quantity: 5 }] }));

      expect(res.status).toBe(409);

      const productRes = await request(app).get(`/api/v1/products/${lowStockProductId}`);
      expect(productRes.body.data.stock).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // GET /orders
  // ──────────────────────────────────────────────────────────────────────────────
  describe('GET /orders', () => {
    it('CUSTOMER solo ve sus propias órdenes', async () => {
      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody());
      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send(validCheckoutBody());

      const res = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].userId).toBe('00000000-0000-0000-0000-000000000004');
    });

    it('ADMIN ve todas las órdenes de todos los clientes', async () => {
      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody());
      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send(validCheckoutBody());

      const res = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.totalItems).toBe(2);
    });

    it('filtra por status', async () => {
      await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody());

      const res = await request(app)
        .get('/api/v1/orders?status=EN_PREPARACION')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('rechaza sin token (401)', async () => {
      const res = await request(app).get('/api/v1/orders');
      expect(res.status).toBe(401);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // GET /orders/:id
  // ──────────────────────────────────────────────────────────────────────────────
  describe('GET /orders/:id', () => {
    it('el dueño (CUSTOMER) puede ver su propia orden (200)', async () => {
      const created = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody());

      const res = await request(app)
        .get(`/api/v1/orders/${created.body.data.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(created.body.data.id);
    });

    it('otro CUSTOMER no puede ver una orden ajena (403)', async () => {
      const created = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody());

      const res = await request(app)
        .get(`/api/v1/orders/${created.body.data.id}`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res.status).toBe(403);
    });

    it('ADMIN, DELIVERY y RESTAURANT pueden ver cualquier orden (200)', async () => {
      const created = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validCheckoutBody());

      for (const token of [adminToken, deliveryToken, restaurantToken]) {
        const res = await request(app)
          .get(`/api/v1/orders/${created.body.data.id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
      }
    });

    it('retorna 404 si la orden no existe', async () => {
      const res = await request(app)
        .get('/api/v1/orders/00000000-0000-0000-0000-000000009999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // PATCH /orders/:id/status — MÁQUINA DE ESTADOS
  // ──────────────────────────────────────────────────────────────────────────────
  describe('PATCH /orders/:id/status', () => {
    async function createOrder(token: string, overrides: Record<string, unknown> = {}) {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(validCheckoutBody(overrides));
      return res.body.data.id as string;
    }

    it('RESTAURANT puede mover PAGADO -> EN_PREPARACION (200)', async () => {
      const orderId = await createOrder(customerToken);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${restaurantToken}`)
        .send({ status: 'EN_PREPARACION' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('EN_PREPARACION');
    });

    it('ADMIN también puede mover PAGADO -> EN_PREPARACION (200)', async () => {
      const orderId = await createOrder(customerToken);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'EN_PREPARACION' });

      expect(res.status).toBe(200);
    });

    it('CUSTOMER y DELIVERY no pueden mover a EN_PREPARACION (403)', async () => {
      const orderId = await createOrder(customerToken);

      for (const token of [customerToken, deliveryToken]) {
        const res = await request(app)
          .patch(`/api/v1/orders/${orderId}/status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: 'EN_PREPARACION' });
        expect(res.status).toBe(403);
      }
    });

    it('DELIVERY puede mover EN_PREPARACION -> EN_CAMINO (200); RESTAURANT y CUSTOMER no (403)', async () => {
      const orderId = await createOrder(customerToken);
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${restaurantToken}`)
        .send({ status: 'EN_PREPARACION' });

      const forbidden1 = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${restaurantToken}`)
        .send({ status: 'EN_CAMINO' });
      expect(forbidden1.status).toBe(403);

      const forbidden2 = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'EN_CAMINO' });
      expect(forbidden2.status).toBe(403);

      const ok = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({ status: 'EN_CAMINO' });
      expect(ok.status).toBe(200);
      expect(ok.body.data.status).toBe('EN_CAMINO');
    });

    it('al ENTREGAR un pedido CASH, setea cashCollectedAt automáticamente', async () => {
      const orderId = await createOrder(customerToken, { paymentMethod: 'CASH' });
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${restaurantToken}`)
        .send({ status: 'EN_PREPARACION' });
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({ status: 'EN_CAMINO' });

      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({ status: 'ENTREGADO' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ENTREGADO');
      expect(res.body.data.cashCollectedAt).not.toBeNull();
    });

    it('al ENTREGAR un pedido CARD, cashCollectedAt permanece null', async () => {
      const orderId = await createOrder(customerToken, { paymentMethod: 'CARD' });
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${restaurantToken}`)
        .send({ status: 'EN_PREPARACION' });
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({ status: 'EN_CAMINO' });

      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({ status: 'ENTREGADO' });

      expect(res.status).toBe(200);
      expect(res.body.data.cashCollectedAt).toBeNull();
    });

    it('el CUSTOMER dueño puede cancelar mientras está PAGADO (200)', async () => {
      const orderId = await createOrder(customerToken);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'CANCELADO' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELADO');
    });

    it('otro CUSTOMER no puede cancelar una orden ajena (403)', async () => {
      const orderId = await createOrder(customerToken);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ status: 'CANCELADO' });

      expect(res.status).toBe(403);
    });

    it('no se puede cancelar después de EN_CAMINO (400)', async () => {
      const orderId = await createOrder(customerToken);
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${restaurantToken}`)
        .send({ status: 'EN_PREPARACION' });
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({ status: 'EN_CAMINO' });

      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELADO' });

      expect(res.status).toBe(400);
    });

    it('rechaza intentar setear PAGADO manualmente (400 — solo se asigna en checkout)', async () => {
      const orderId = await createOrder(customerToken);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PAGADO' });

      expect(res.status).toBe(400);
    });

    it('rechaza un valor de estado desconocido (400)', async () => {
      const orderId = await createOrder(customerToken);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ESTADO_INVENTADO' });

      expect(res.status).toBe(400);
    });

    it('retorna 404 al actualizar una orden inexistente', async () => {
      const res = await request(app)
        .patch('/api/v1/orders/00000000-0000-0000-0000-000000009999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'EN_PREPARACION' });

      expect(res.status).toBe(404);
    });

    it('no permite transicionar un pedido ya ENTREGADO (400)', async () => {
      const orderId = await createOrder(customerToken);
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${restaurantToken}`)
        .send({ status: 'EN_PREPARACION' });
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({ status: 'EN_CAMINO' });
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({ status: 'ENTREGADO' });

      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELADO' });

      expect(res.status).toBe(400);
    });
  });
});
