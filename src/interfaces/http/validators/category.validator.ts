import { z } from 'zod';

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de categoría inválido (debe ser UUID)'),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres'),
    description: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de categoría inválido (debe ser UUID)'),
  }),
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres').optional(),
    description: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
