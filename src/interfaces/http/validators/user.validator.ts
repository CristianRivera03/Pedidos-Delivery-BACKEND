import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    name: z.string().min(2).max(100).optional(),
    password: z.string().min(8).max(100).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid id format'),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid id format'),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
