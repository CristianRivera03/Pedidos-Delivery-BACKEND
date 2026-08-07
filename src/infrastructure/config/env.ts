import 'dotenv/config';

import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    APP_NAME: z.string().default('pedidos-delivery-backend'),

    USE_LOCAL_DB: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),

    LOCAL_DATABASE_URL: z.string().optional(),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: z.string().optional(),

    JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  })
  .refine(
    (data) =>
      data.USE_LOCAL_DB || (data.DIRECT_URL && data.DIRECT_URL.length > 0),
    {
      message: 'DIRECT_URL is required when USE_LOCAL_DB=false (needed for Prisma Migrate)',
      path: ['DIRECT_URL'],
    },
  );

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const raw: NodeJS.ProcessEnv = { ...process.env };
  raw.USE_LOCAL_DB = process.env.USE_LOCAL_DB ?? 'false';

  const useLocal = raw.USE_LOCAL_DB === 'true';
  const effectiveDatabaseUrl =
    useLocal && raw.LOCAL_DATABASE_URL ? raw.LOCAL_DATABASE_URL : (raw.DATABASE_URL ?? '');

  // En modo Local, DIRECT_URL se setea automáticamente a LOCAL_DATABASE_URL
  // si no está definido (Prisma Migrate lo necesita).
  const effectiveDirectUrl = useLocal
    ? (raw.DIRECT_URL || raw.LOCAL_DATABASE_URL || '')
    : (raw.DIRECT_URL || '');

  const result = envSchema.safeParse({
    ...raw,
    DATABASE_URL: effectiveDatabaseUrl,
    DIRECT_URL: effectiveDirectUrl,
  });

  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }
  return result.data;
}

export const env: Env = loadEnv();