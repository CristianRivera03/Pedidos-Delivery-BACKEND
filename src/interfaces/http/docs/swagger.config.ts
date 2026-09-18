import path from 'path';

import swaggerJsdoc from 'swagger-jsdoc';

import { env } from '@infrastructure/config/env';

const isDev = env.NODE_ENV === 'development';
const routesDir = path.join(process.cwd(), isDev ? 'src' : 'dist', 'interfaces', 'http', 'routes');
const controllersDir = path.join(
  process.cwd(),
  isDev ? 'src' : 'dist',
  'interfaces',
  'http',
  'controllers',
);

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Pedidos Delivery API',
      version: '1.0.0',
      description: 'REST API para sistema de pedidos delivery',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Role: {
          type: 'string',
          enum: ['ADMIN', 'CUSTOMER', 'DELIVERY', 'RESTAURANT'],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            name: { type: 'string', example: 'Juan Pérez' },
            phone: { type: 'string', example: '+50370001234' },
            role: { $ref: '#/components/schemas/Role' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['email', 'name', 'phone', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string', minLength: 2, maxLength: 100 },
            phone: { type: 'string', example: '+50370001234' },
            password: { type: 'string', minLength: 8, maxLength: 100 },
            role: { $ref: '#/components/schemas/Role' },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string', minLength: 2, maxLength: 100 },
            phone: { type: 'string', example: '+50370001234' },
            password: { type: 'string', minLength: 8, maxLength: 100 },
            role: { $ref: '#/components/schemas/Role' },
            isActive: { type: 'boolean' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'name', 'phone', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string', minLength: 2, maxLength: 100 },
            phone: { type: 'string', example: '+50370001234' },
            password: { type: 'string', minLength: 8, maxLength: 100 },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'DELIVERY', 'RESTAURANT'],
              default: 'CUSTOMER',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                refreshToken: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'NotFoundError' },
                message: { type: 'string', example: 'Resource not found' },
              },
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            name: { type: 'string', example: 'Bebidas' },
            description: { type: 'string', nullable: true, example: 'Bebidas frías y calientes' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', example: '17/09/2026, 09:37:00 PM' },
            updatedAt: { type: 'string', example: '17/09/2026, 09:37:00 PM' },
          },
        },
        CreateCategoryRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100, example: 'Bebidas' },
            description: { type: 'string', maxLength: 255, nullable: true, example: 'Bebidas frías y calientes' },
          },
        },
        UpdateCategoryRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100, example: 'Bebidas Actualizadas' },
            description: { type: 'string', maxLength: 255, nullable: true, example: 'Nueva descripción' },
            isActive: { type: 'boolean', example: true },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' },
            categoryId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            name: { type: 'string', example: 'Pupusa de Queso' },
            description: { type: 'string', nullable: true, example: 'Tradicional pupusa de queso' },
            price: { type: 'number', minimum: 0.01, example: 1.25 },
            stock: { type: 'integer', minimum: 0, example: 50 },
            imageUrl: { type: 'string', format: 'uri', nullable: true, example: 'https://example.com/pupusa.jpg' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', example: '17/09/2026, 09:37:00 PM' },
            updatedAt: { type: 'string', example: '17/09/2026, 09:37:00 PM' },
          },
        },
        CreateProductRequest: {
          type: 'object',
          required: ['categoryId', 'name', 'price', 'stock'],
          properties: {
            categoryId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            name: { type: 'string', minLength: 1, maxLength: 150, example: 'Pupusa de Queso' },
            description: { type: 'string', maxLength: 500, nullable: true, example: 'Tradicional pupusa' },
            price: { type: 'number', minimum: 0.01, example: 1.25 },
            stock: { type: 'integer', minimum: 0, example: 50 },
            imageUrl: { type: 'string', format: 'uri', nullable: true, example: 'https://example.com/pupusa.jpg' },
          },
        },
        UpdateProductRequest: {
          type: 'object',
          properties: {
            categoryId: { type: 'string', format: 'uuid' },
            name: { type: 'string', minLength: 1, maxLength: 150 },
            description: { type: 'string', maxLength: 500, nullable: true },
            price: { type: 'number', minimum: 0.01 },
            stock: { type: 'integer', minimum: 0 },
            imageUrl: { type: 'string', format: 'uri', nullable: true },
            isActive: { type: 'boolean' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'No autenticado (token faltante o inválido)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Forbidden: {
          description: 'Sin permisos suficientes para este recurso',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        BadRequest: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Conflict: {
          description: 'Conflicto (recurso duplicado)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        InternalServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Registro y autenticación',
      },
      {
        name: 'Users',
        description: 'Gestión de usuarios',
      },
      {
        name: 'Categories',
        description: 'Gestión y catálogo de categorías de productos',
      },
      {
        name: 'Products',
        description: 'Gestión y catálogo de productos (menú)',
      },
    ],
  },

  apis: [
    `${routesDir}/*.ts`,
    `${routesDir}/*.js`,
    `${controllersDir}/*.ts`,
    `${controllersDir}/*.js`,
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
