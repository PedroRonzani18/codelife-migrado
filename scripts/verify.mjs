import { execFileSync, spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { assertNode24, run, runPnpm } from './lib/runtime.mjs';

assertNode24();
const project = `codelife-verify-${process.pid}`;
const compose = ['compose', '--project-name', project, '-f', 'scripts/verify-compose.yml'];
let api;
function docker(args) { run('docker', [...compose, ...args]); }
function testUrl() {
  const portLine = execFileSync('docker', [...compose, 'port', 'postgres', '5432'], { encoding: 'utf8' }).trim();
  const port = portLine.match(/:(\d+)$/)?.[1];
  if (!port) throw new Error(`Could not determine test database port from ${portLine}`);
  return `postgresql://postgres:postgres@127.0.0.1:${port}/codelife_test?application_name=codelife-verify`;
}
async function waitForApi() {
  for (let retry = 0; retry < 30; retry += 1) {
    try { if ((await fetch('http://127.0.0.1:3001/health')).ok) return; } catch {}
    await delay(250);
  }
  throw new Error('API did not become ready for E2E verification');
}
try {
  docker(['up', '--detach', '--wait']);
  const env = { ...process.env, DATABASE_URL: testUrl(), NODE_ENV: 'test', API_PORT: '3001', WEB_ORIGIN: 'http://127.0.0.1:5173', JWT_SECRET: 'codelife-verify-secret', AUTH_COOKIE_SECURE: 'false', AUTH_COOKIE_SAME_SITE: 'lax', AUTH_COOKIE_MAX_AGE_SECONDS: '3600', EXPERIMENTAL_LOGIN_ENABLED: 'true', VITE_API_URL: 'http://127.0.0.1:3001' };
  runPnpm(['--filter', '@codelife/api', 'prisma:migrate:deploy'], { env });
  runPnpm(['--filter', '@codelife/api', 'prisma:seed'], { env });
  runPnpm(['check'], { env });
  runPnpm(['test:api:integration'], { env });
  api = spawn('corepack', ['pnpm', '--filter', '@codelife/api', 'dev'], { env, stdio: 'inherit' });
  await waitForApi();
  runPnpm(['test:web:e2e'], { env });
} finally {
  api?.kill('SIGTERM');
  docker(['down', '--volumes', '--remove-orphans']);
}
