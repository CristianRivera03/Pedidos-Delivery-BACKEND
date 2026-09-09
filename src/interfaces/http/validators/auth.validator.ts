import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone format'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    role: z.enum(['CUSTOMER', 'DELIVERY', 'RESTAURANT']).default('CUSTOMER'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(20, 'Invalid refresh token'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
