import { z } from 'zod';

const roleEnum = z.enum(['ADMIN', 'CUSTOMER', 'DELIVERY', 'RESTAURANT']);
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone format');

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: phoneSchema,
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    role: roleEnum.optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    name: z.string().min(2).max(100).optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(8).max(100).optional(),
    role: roleEnum.optional(),
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
