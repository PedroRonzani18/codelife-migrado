import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { assertNode24, run, runPnpm } from './lib/runtime.mjs';

assertNode24();
const project = `codelife-verify-${process.pid}`;
const compose = ['compose', '--project-name', project, '-f', 'scripts/verify-compose.yml'];
let api;
let web;
function docker(args) { run('docker', [...compose, ...args]); }
function testUrl() {
  const portLine = execFileSync('docker', [...compose, 'port', 'postgres', '5432'], { encoding: 'utf8' }).trim();
  const port = portLine.match(/:(\d+)$/)?.[1];
  if (!port) throw new Error(`Could not determine test database port from ${portLine}`);
  const url = `postgresql://postgres:postgres@127.0.0.1:${port}/codelife_test?application_name=codelife-verify`;
  assertIsolatedTestDatabase(url);
  return url;
}

function assertIsolatedTestDatabase(value) {
  const url = new URL(value);
  if (url.protocol !== 'postgresql:' || url.hostname !== '127.0.0.1' || url.pathname !== '/codelife_test') {
    throw new Error(`Refusing to verify against a non-isolated database: ${url.hostname}${url.pathname}`);
  }
}

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') return reject(new Error('Could not reserve a local port'));
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForUrl(url, child, label) {
  for (let retry = 0; retry < 80; retry += 1) {
    if (child.exitCode !== null) throw new Error(`${label} exited before becoming ready with code ${child.exitCode}`);
    try { if ((await fetch(url)).ok) return; } catch {}
    await delay(250);
  }
  throw new Error(`${label} did not become ready at ${url}`);
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    delay(5_000).then(() => { if (child.exitCode === null) child.kill('SIGKILL'); }),
  ]);
}
try {
  docker(['up', '--detach', '--wait']);
  const [apiPort, webPort] = await Promise.all([reservePort(), reservePort()]);
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const webUrl = `http://127.0.0.1:${webPort}`;
  const env = {
    ...process.env,
    DATABASE_URL: testUrl(),
    NODE_ENV: 'test',
    API_PORT: String(apiPort),
    WEB_ORIGIN: webUrl,
    JWT_SECRET: 'codelife-verify-secret-with-32-characters',
    JWT_ISSUER: 'codelife-api',
    JWT_AUDIENCE: 'codelife-web',
    AUTH_COOKIE_SECURE: 'false',
    AUTH_COOKIE_SAME_SITE: 'lax',
    AUTH_COOKIE_MAX_AGE_SECONDS: '3600',
    EXPERIMENTAL_LOGIN_ENABLED: 'true',
    SWAGGER_ENABLED: 'false',
    VITE_API_URL: apiUrl,
    WEB_E2E_URL: webUrl,
  };
  assertIsolatedTestDatabase(env.DATABASE_URL);
  runPnpm(['--filter', 'api', 'prisma:migrate:deploy'], { env });
  runPnpm(['--filter', 'api', 'prisma:seed'], { env });
  runPnpm(['--filter', 'api', 'prisma:seed'], { env });
  runPnpm(['check'], { env });
  runPnpm(['test:api:integration'], { env });
  api = spawn('pnpm', ['--filter', 'api', 'exec', 'node', 'dist/main.js'], { env, stdio: 'inherit' });
  await waitForUrl(`${apiUrl}/health/ready`, api, 'API');
  web = spawn('pnpm', ['--filter', 'web', 'exec', 'vite', '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { env, stdio: 'inherit' });
  await waitForUrl(webUrl, web, 'web');
  runPnpm(['test:web:e2e'], { env });
} finally {
  await stopProcess(web);
  await stopProcess(api);
  docker(['down', '--volumes', '--remove-orphans']);
}
