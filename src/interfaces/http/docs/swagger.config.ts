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
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
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
