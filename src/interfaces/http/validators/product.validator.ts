import { z } from 'zod';

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de producto inválido (debe ser UUID)'),
  }),
});

export const listProductsQuerySchema = z.object({
  query: z.object({
    categoryId: z.string().uuid('ID de categoría inválido').optional(),
    search: z.string().optional(),
    activeOnly: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => (val !== undefined ? val === 'true' : undefined)),
    all: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => val === 'true'),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  }),
});


export const createProductSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid('ID de categoría inválido (debe ser UUID)'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(150, 'Máximo 150 caracteres'),
    description: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
    price: z.number().positive('El precio debe ser mayor a 0 (precio > 0)'),
    stock: z.number().int('El stock debe ser entero').min(0, 'El stock no puede ser negativo (stock >= 0)'),
    imageUrl: z.string().url('Formato de URL de imagen inválido').optional().nullable(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de producto inválido (debe ser UUID)'),
  }),
  body: z.object({
    categoryId: z.string().uuid('ID de categoría inválido').optional(),
    name: z.string().min(2).max(150).optional(),
    description: z.string().max(1000).optional().nullable(),
    price: z.number().positive('El precio debe ser mayor a 0').optional(),
    stock: z.number().int().min(0, 'El stock no puede ser negativo').optional(),
    imageUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>['query'];
