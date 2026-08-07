#!/usr/bin/env node
// bin/setup.mjs
import process from 'node:process';

import {
  envFileExists,
  envFilePath,
  generateJwtSecret,
  projectRoot,
  readEnvFile,
  readEnvExample,
  setEnvValue,
  writeEnvFile,
} from './lib/env.mjs';
import {
  c,
  confirm,
  error,
  exec,
  execCapture,
  header,
  info,
  isDockerAvailable,
  isPortInUse,
  log,
  prompt,
  promptSecret,
  step,
  success,
  waitForHealthy,
  warn,
} from './lib/exec.mjs';
import {
  hasPlaceholder,
  isSupabaseDirectUrl,
  isSupabasePoolerUrl,
  validateEnvValues,
} from './lib/validators.mjs';

const ROOT = projectRoot();
process.chdir(ROOT);

async function chooseDatabase() {
  log(c.bold('¿Qué base de datos vas a usar?'));
  log(`  ${c.cyan('1)')} Supabase ${c.gray('(nube, requiere cuenta)')}`);
  log(`  ${c.cyan('2)')} Local   ${c.gray('(Docker, sin internet)')}`);
  log(`  ${c.cyan('3)')} Ya tengo .env configurado, solo validar`);
  log('');

  const answer = await prompt(`Opción ${c.gray('[1]')}`);
  return answer === '2' ? 'local' : answer === '3' ? 'existing' : 'supabase';
}

async function setupSupabase() {
  step(1, 'Configurar Supabase');
  log('');
  info('Ve a https://supabase.com → tu proyecto → Settings → Database');
  info('Necesitas DOS connection strings (reemplaza [YOUR-PASSWORD]):');
  log(`  ${c.gray('•')} ${c.cyan('Transaction (pooler)')}: puerto ${c.bold('6543')} → para DATABASE_URL`);
  log(`  ${c.gray('•')} ${c.cyan('Session (direct)')}:    puerto ${c.bold('5432')} → para DIRECT_URL`);
  log('');

  let databaseUrl = '';
  let directUrl = '';

  while (true) {
    databaseUrl = await promptSecret('DATABASE_URL (pooler)');
    if (hasPlaceholder(databaseUrl)) {
      warn('Detectado placeholder [YOUR-PASSWORD]. Reemplázalo con tu password real.');
      continue;
    }
    if (!isSupabasePoolerUrl(databaseUrl)) {
      warn('La URL no parece válida (debe incluir pooler.supabase.com:6543)');
      const retry = await confirm('¿Reintentar?', true);
      if (!retry) break;
      continue;
    }
    break;
  }

  while (true) {
    directUrl = await promptSecret('DIRECT_URL (directo)');
    if (hasPlaceholder(directUrl)) {
      warn('Detectado placeholder [YOUR-PASSWORD].');
      continue;
    }
    if (!isSupabaseDirectUrl(directUrl)) {
      warn('La URL no parece válida (debe incluir pooler.supabase.com:5432 o *.supabase.co)');
      const retry = await confirm('¿Reintentar?', true);
      if (!retry) break;
      continue;
    }
    break;
  }

  return {
    USE_LOCAL_DB: 'false',
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl,
  };
}

async function setupLocal() {
  step(1, 'Configurar Postgres local');
  log('');
  info('Se levantará Postgres 16 en Docker');
  info('Usuario: postgres / Password: postgres / DB: pedidos_delivery');
  log('');

  // Detectar si el puerto 5433 está ocupado (ej: Postgres nativo)
  const portInUse = await isPortInUse(5433);
  let port = 5433;

  if (portInUse) {
    warn('El puerto 5433 ya está en uso (¿otra app?).');
    const useAlt = await confirm('¿Usar puerto alternativo 5434?', true);
    if (useAlt) {
      port = 5434;
    } else {
      const custom = await prompt('Puerto a usar');
      if (custom && /^\d+$/.test(custom)) {
        port = parseInt(custom, 10);
      } else {
        warn('Puerto inválido, usando 5433');
        port = 5433;
      }
    }
  }

  info(`Postgres se expondrá en localhost:${port}`);
  log('');

  const localUrl = `postgresql://postgres:postgres@localhost:${port}/pedidos_delivery?schema=public`;

  return {
    USE_LOCAL_DB: 'true',
    LOCAL_DATABASE_URL: localUrl,
    // Prisma Migrate lee .env directamente (no pasa por env.ts).
    // En modo Local, DIRECT_URL debe apuntar a la misma DB local.
    DATABASE_URL: localUrl,
    DIRECT_URL: localUrl,
    POSTGRES_PORT: String(port),
  };
}

async function configSecrets(existing) {
  step(2, 'Configurar secretos');
  log('');

  const config = { ...existing };

  // JWT_SECRET
  if (existing.JWT_SECRET && !existing.JWT_SECRET.includes('change-this-super-secret')) {
    info(`JWT_SECRET ya configurado (${existing.JWT_SECRET.length} chars)`);
  } else {
    const regen = await confirm('¿Generar nuevo JWT_SECRET automáticamente?', true);
    if (regen) {
      config.JWT_SECRET = generateJwtSecret();
      success(`JWT_SECRET generado (${config.JWT_SECRET.length} chars)`);
    } else {
      while (true) {
        const secret = await promptSecret('Ingresa tu JWT_SECRET existente (mín 10 chars)');
        if (secret.length >= 10) {
          config.JWT_SECRET = secret;
          break;
        }
        warn('El JWT_SECRET debe tener al menos 10 caracteres.');
      }
    }
  }

  // Admin password
  if (existing.SEED_ADMIN_PASSWORD && existing.SEED_ADMIN_PASSWORD !== 'Admin123!') {
    info(`SEED_ADMIN_PASSWORD ya configurado`);
  } else {
    const custom = await confirm('¿Custom password para admin del seed?', false);
    if (custom) {
      config.SEED_ADMIN_PASSWORD = await promptSecret('SEED_ADMIN_PASSWORD (mín 8 chars)');
    }
  }

  return config;
}

async function npmInstall() {
  step(4, 'Instalar dependencias');
  log('');
  if (await confirm('¿Ejecutar npm install?', true)) {
    await exec('npm', ['install']);
    success('Dependencias instaladas');
  } else {
    warn('Saltado. Recuerda ejecutar npm install antes de continuar.');
  }
}

async function prismaGenerate() {
  step(5, 'Generar Prisma Client');
  log('');
  await exec('npx', ['prisma', 'generate']);
  success('Prisma Client generado');
}

async function startDocker(config) {
  step(6, 'Levantar Postgres en Docker');
  log('');
  info('Levantando contenedor pedidos-postgres...');
  const env = { ...process.env };
  if (config.POSTGRES_PORT) {
    env.POSTGRES_PORT = config.POSTGRES_PORT;
  }
  await exec('docker', ['compose', '-f', 'docker/docker-compose.yml', 'up', '-d', 'postgres'], { env });
  info('Esperando a que Postgres esté listo...');
  const ok = await waitForHealthy(60000);
  if (ok) {
    success('Postgres listo');
  } else {
    warn('Postgres no respondió en 60s. Revisa: docker logs pedidos-postgres');
  }
}

async function runMigrations() {
  step(7, 'Ejecutar migraciones');
  log('');
  if (await confirm('¿Ejecutar prisma migrate dev?', true)) {
    await exec('npx', ['prisma', 'migrate', 'dev', '--name', 'init']);
    success('Migraciones aplicadas');
    return true;
  } else {
    warn('Saltado. Ejecuta manualmente: npm run prisma:migrate');
    return false;
  }
}

async function runSeed(migrationsRan) {
  step(8, 'Cargar seed');
  log('');
  if (!migrationsRan) {
    warn('Seed omitido automáticamente porque se saltaron las migraciones.');
    return;
  }

  if (await confirm('¿Cargar datos iniciales (admin user)?', true)) {
    await exec('npm', ['run', 'prisma:seed']);
    success('Seed cargado');
  } else {
    warn('Seed saltado.');
  }
}

async function main() {
  header('Pedidos Delivery Backend - Setup');

  // 0. Pre-checks
  if (!(await isDockerAvailable())) {
    warn('Docker no detectado. Si elegiste Local, lo necesitas.');
    warn('Si elegiste Supabase, puedes continuar.');
  }

  const hasMake = await execCapture('make', ['--version'])
    .then(() => true)
    .catch(() => false);
  if (!hasMake) {
    warn('make no detectado. Usa npm run como alternativa:');
    log(`  ${c.gray('npm run setup  →  make setup')}`);
    log(`  ${c.gray('npm run dev     →  make dev')}`);
    log(`  ${c.gray('npm test        →  make test')}`);
    log(`  ${c.gray('npm run lint    →  make lint')}`);
    log(`  ${c.gray('npm run build   →  make build')}`);
    log('');
  }

  // 1. Wizard
  const choice = await chooseDatabase();

  // Start from .env.example defaults so validation has all required keys
  let config = readEnvExample();
  if (choice === 'supabase') {
    config = { ...config, ...(await setupSupabase()) };
  } else if (choice === 'local') {
    config = { ...config, ...(await setupLocal()) };
  } else {
    // existing
    if (!envFileExists()) {
      error('.env no existe. Ejecuta setup primero.');
      process.exit(1);
    }
    config = readEnvFile();
    log(`USE_LOCAL_DB: ${config.USE_LOCAL_DB}`);
    log(`DATABASE_URL: ${config.DATABASE_URL ? '***' : '(vacío)'}`);
    log(`DIRECT_URL: ${config.DIRECT_URL ? '***' : '(vacío)'}`);
  }

  // 2. Secrets
  config = { ...config, ...(await configSecrets(config)) };

  // 3. Validate BEFORE saving
  const errors = validateEnvValues(config);
  if (errors.length > 0) {
    error('Errores de validación:');
    for (const err of errors) log(`  ${c.red('•')} ${err}`);
    process.exit(1);
  }

  // 4. Persist .env
  step(3, 'Guardar .env');
  if (envFileExists()) {
    const overwrite = await confirm('.env ya existe. ¿Sobrescribir?', false);
    if (!overwrite) {
      info('Aplicando cambios puntuales...');
      for (const [key, value] of Object.entries(config)) {
        if (value !== undefined) setEnvValue(key, value);
      }
    } else {
      writeEnvFile(config);
    }
  } else {
    writeEnvFile(config);
  }
  success(`Guardado en ${c.gray(envFilePath())}`);

  // 5. npm install
  await npmInstall();

  // 6. Prisma generate
  await prismaGenerate();

  // 7. Docker up (only local)
  if (config.USE_LOCAL_DB === 'true') {
    await startDocker(config);
  }

  // 8. Migrations
  const migrationsRan = await runMigrations();

  // 9. Seed
  await runSeed(migrationsRan);

  // Done
  header('Setup completado');
  log('');
  success('Próximos pasos:');
  if (hasMake) {
    log(`  ${c.cyan('make dev')}      ${c.gray('# levantar la app en modo desarrollo')}`);
    log(`  ${c.cyan('make up')}       ${c.gray('# levantar Docker')}`);
    log(`  ${c.cyan('make help')}     ${c.gray('# ver todos los comandos')}`);
  } else {
    log(`  ${c.cyan('npm run dev')}   ${c.gray('# levantar la app en modo desarrollo')}`);
    log(`  ${c.cyan('docker compose -f docker/docker-compose.yml up -d')}   ${c.gray('# levantar Docker')}`);
    log(`  ${c.gray('# Ver docs/setup.md para más comandos')}`);
  }
  log('');
  log(`${c.gray('URLs:')}`);
  log(`  ${c.gray('API:        ')} ${c.cyan('http://localhost:3000/api/v1')}`);
  log(`  ${c.gray('Health:     ')} ${c.cyan('http://localhost:3000/health')}`);
  log(`  ${c.gray('Swagger:    ')} ${c.cyan('http://localhost:3000/api/docs')}`);
  if (config.USE_LOCAL_DB === 'true') {
    log(`  ${c.gray('pgAdmin:    ')} ${c.cyan('http://localhost:5050')}`);
  }
  log('');
}

main().catch((err) => {
  error(err.message);
  if (process.env.DEBUG) console.error(err);
  process.exit(1);
});
