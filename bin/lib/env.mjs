// bin/lib/env.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

export const PATHS = {
  root: ROOT,
  envFile: path.join(ROOT, '.env'),
  envExample: path.join(ROOT, '.env.example'),
  packageJson: path.join(ROOT, 'package.json'),
  prismaDir: path.join(ROOT, 'prisma'),
  dockerCompose: path.join(ROOT, 'docker', 'docker-compose.yml'),
};

export function projectRoot() {
  return ROOT;
}

export function envFilePath() {
  return PATHS.envFile;
}

export function envFileExists() {
  return fs.existsSync(PATHS.envFile);
}

export function readEnvFile() {
  if (!envFileExists()) return {};
  return parseEnvFile(fs.readFileSync(PATHS.envFile, 'utf8'));
}

export function readEnvExample() {
  if (!fs.existsSync(PATHS.envExample)) return {};
  return parseEnvFile(fs.readFileSync(PATHS.envExample, 'utf8'));
}

function parseEnvFile(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function formatValue(value) {
  const needsQuotes = /[\s#"']/.test(String(value));
  return needsQuotes ? `"${String(value).replace(/"/g, '\\"')}"` : String(value);
}

export function writeEnvFile(values) {
  const example = fs.readFileSync(PATHS.envExample, 'utf8');
  const lines = example.split('\n');

  const seenKeys = new Set();
  const out = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return line;
      const key = trimmed.slice(0, eqIdx).trim();
      seenKeys.add(key);
      if (values[key] !== undefined) {
        return `${key}=${formatValue(values[key])}`;
      }
      return line;
    })
    .join('\n');

  // Append any extra keys not in .env.example
  const extra = [];
  for (const [key, value] of Object.entries(values)) {
    if (seenKeys.has(key)) continue;
    if (value === undefined) continue;
    extra.push(`${key}=${formatValue(value)}`);
  }

  const final =
    extra.length > 0 ? out + '\n\n# Custom (added by setup)\n' + extra.join('\n') + '\n' : out;
  fs.writeFileSync(PATHS.envFile, final, 'utf8');
}

export function setEnvValue(key, value) {
  // Lee el .env actual (preserva keys custom y comentarios no),
  // actualiza solo la key pedida, y reescribe preservando el resto.
  if (!envFileExists()) {
    writeEnvFile({ [key]: value });
    return;
  }
  const content = fs.readFileSync(PATHS.envFile, 'utf8');
  const lines = content.split('\n');
  let found = false;
  const out = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return line;
      const k = trimmed.slice(0, eqIdx).trim();
      if (k === key) {
        found = true;
        return `${key}=${formatValue(value)}`;
      }
      return line;
    })
    .join('\n');

  if (!found) {
    fs.writeFileSync(PATHS.envFile, out + `\n${key}=${formatValue(value)}\n`, 'utf8');
  } else {
    fs.writeFileSync(PATHS.envFile, out, 'utf8');
  }
}

export function generateJwtSecret() {
  return crypto.randomBytes(32).toString('hex');
}