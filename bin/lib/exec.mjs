// bin/lib/exec.mjs
import { spawn } from 'node:child_process';
import process from 'node:process';

const IS_WIN = process.platform === 'win32';

// npm/npx on Windows are .cmd files that need shell=true.
// node/docker are real executables that work with shell=false.
function needsShell(cmd) {
  if (!IS_WIN) return false;
  return ['npm', 'npx', 'yarn', 'pnpm'].includes(cmd);
}

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

export const c = {
  red: (s) => `${COLORS.red}${s}${COLORS.reset}`,
  green: (s) => `${COLORS.green}${s}${COLORS.reset}`,
  yellow: (s) => `${COLORS.yellow}${s}${COLORS.reset}`,
  blue: (s) => `${COLORS.blue}${s}${COLORS.reset}`,
  cyan: (s) => `${COLORS.cyan}${s}${COLORS.reset}`,
  gray: (s) => `${COLORS.gray}${s}${COLORS.reset}`,
  bold: (s) => `${COLORS.bold}${s}${COLORS.reset}`,
};

export function log(msg) {
  console.log(msg);
}

export function info(msg) {
  console.log(`${c.blue('ℹ')}${c.gray('  ' + msg)}`);
}

export function success(msg) {
  console.log(`${c.green('✓')}  ${msg}`);
}

export function warn(msg) {
  console.log(`${c.yellow('⚠')}  ${msg}`);
}

export function error(msg) {
  console.log(`${c.red('✗')}  ${msg}`);
}

export function step(n, msg) {
  console.log(`\n${c.bold(c.cyan(`[${n}]`))} ${c.bold(msg)}`);
}

export function header(title) {
  const line = '═'.repeat(60);
  console.log('\n' + c.cyan(line));
  console.log(c.cyan('  ' + title));
  console.log(c.cyan(line) + '\n');
}

export function exec(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: needsShell(cmd),
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`Command failed: ${cmd} ${args.join(' ')} (exit ${code})`));
    });
  });
}

export async function execCapture(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: needsShell(cmd),
      ...options,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `Command failed (exit ${code})`));
    });
  });
}

export async function confirm(question, defaultYes = false) {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  process.stdout.write(`${question} ${c.gray(`[${hint}]`)}: `);
  return new Promise((resolve) => {
    let resolved = false;
    const done = (value) => {
      if (resolved) return;
      resolved = true;
      stdin.removeListener('data', onData);
      stdin.removeListener('end', onEnd);
      resolve(value);
    };
    const onData = (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === '') done(defaultYes);
      else done(answer === 'y' || answer === 'yes');
    };
    const onEnd = () => done(defaultYes);
    const stdin = process.stdin;
    stdin.resume();
    stdin.once('data', onData);
    stdin.once('end', onEnd);
  });
}

export async function prompt(question) {
  process.stdout.write(`${question}: `);
  return new Promise((resolve) => {
    let resolved = false;
    const done = (value) => {
      if (resolved) return;
      resolved = true;
      stdin.removeListener('data', onData);
      stdin.removeListener('end', onEnd);
      resolve(value);
    };
    const onData = (data) => done(data.toString().trim());
    const onEnd = () => done('');
    const stdin = process.stdin;
    stdin.resume();
    stdin.once('data', onData);
    stdin.once('end', onEnd);
  });
}

export async function promptSecret(question) {
  process.stdout.write(`${question}: `);
  return new Promise((resolve) => {
    const stdin = process.stdin;
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    let input = '';
    const onData = (ch) => {
      const c = ch.toString('utf8');
      if (c === '\n' || c === '\r' || c === '\u0004') {
        if (stdin.isTTY) stdin.setRawMode(false);
        stdin.removeListener('data', onData);
        stdin.pause();
        process.stdout.write('\n');
        resolve(input);
      } else if (c === '\u0003') {
        if (stdin.isTTY) stdin.setRawMode(false);
        process.exit(1);
      } else if (c === '\u007f' || c === '\b') {
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        input += c;
        process.stdout.write('*');
      }
    };
    stdin.resume();
    stdin.on('data', onData);
  });
}

export function isDockerAvailable() {
  return execCapture('docker', ['--version'])
    .then(() => true)
    .catch(() => false);
}

export async function isPortInUse(port) {
  try {
    const { stdout } = await execCapture('node', [
      '-e',
      `const net=require('net');const s=net.createServer();s.on('error',()=>{process.exit(1)});s.listen(${port},()=>{s.close();process.exit(0)})`,
    ]);
    return false;
  } catch {
    return true;
  }
}

export async function waitForHealthy(timeoutMs = 60000) {
  const start = Date.now();

  // First check that the container is running
  while (Date.now() - start < timeoutMs) {
    try {
      const { stdout } = await execCapture('docker', [
        'compose',
        '-f',
        'docker/docker-compose.yml',
        'ps',
        '--format',
        '{{.Names}} {{.Status}}',
        'postgres',
      ]);
      if (stdout.includes('pedidos-postgres') && stdout.includes('Up')) {
        break;
      }
    } catch {
      // compose ps may fail if not started yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Now poll pg_isready
  while (Date.now() - start < timeoutMs) {
    try {
      const { stdout } = await execCapture('docker', [
        'compose',
        '-f',
        'docker/docker-compose.yml',
        'exec',
        '-T',
        'postgres',
        'pg_isready',
        '-U',
        'postgres',
      ]);
      if (stdout.includes('accepting connections')) return true;
    } catch {
      // container may not be ready yet, retry
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}
