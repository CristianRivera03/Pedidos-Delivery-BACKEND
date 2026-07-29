// bin/lib/validators.mjs
import { URL } from 'node:url';

const SUPABASE_POOLER_REGEX = /^[^.]+\.pooler\.supabase\.com$/;
const SUPABASE_DIRECT_REGEX = /^[^.]+\.supabase\.co$/;

export function isValidPostgresUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') return false;
    if (!parsed.hostname) return false;
    if (!parsed.username || parsed.password === null) return false;
    return true;
  } catch {
    return false;
  }
}

export function isSupabasePoolerUrl(url) {
  if (!isValidPostgresUrl(url)) return false;
  try {
    const parsed = new URL(url);
    return SUPABASE_POOLER_REGEX.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function isSupabaseDirectUrl(url) {
  if (!isValidPostgresUrl(url)) return false;
  try {
    const parsed = new URL(url);
    return SUPABASE_POOLER_REGEX.test(parsed.hostname) || SUPABASE_DIRECT_REGEX.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function hasPlaceholder(url) {
  return !url || /\[YOUR-PASSWORD\]|\[PASSWORD\]/.test(url);
}

export function validateEnvValues(env) {
  const errors = [];

  const useLocal = env.USE_LOCAL_DB === 'true';

  if (useLocal) {
    if (!env.LOCAL_DATABASE_URL) {
      errors.push('LOCAL_DATABASE_URL is required when USE_LOCAL_DB=true');
    } else if (!isValidPostgresUrl(env.LOCAL_DATABASE_URL)) {
      errors.push('LOCAL_DATABASE_URL is not a valid postgres URL');
    }
  } else {
    if (!isValidPostgresUrl(env.DATABASE_URL)) {
      errors.push('DATABASE_URL is not a valid postgres URL');
    }
    if (!isValidPostgresUrl(env.DIRECT_URL)) {
      errors.push('DIRECT_URL is not a valid postgres URL (needed for Prisma Migrate)');
    }
  }

  if (!env.JWT_SECRET || env.JWT_SECRET.length < 10) {
    errors.push('JWT_SECRET must be at least 10 characters');
  }

  if (env.JWT_SECRET && env.JWT_SECRET.includes('change-this-super-secret')) {
    errors.push('JWT_SECRET is still the placeholder. Generate a real one.');
  }

  if (!env.NODE_ENV) {
    errors.push('NODE_ENV is required');
  }

  return errors;
}