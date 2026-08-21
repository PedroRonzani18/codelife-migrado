import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { assertNode24, run, runPnpm } from './lib/runtime.mjs';

assertNode24();
const project = `codelife-verify-${process.pid}`;
const compose = ['compose', '--project-name', project, '-f', 'scripts/verify-compose.yml'];
let api;
let web;
function docker(args) { run('docker', [...compose, ...args]); }

function psql(database, sql) {
  return execFileSync(
    'docker',
    [...compose, 'exec', '-T', 'postgres', 'psql', '--username', 'postgres', '--dbname', database, '--set', 'ON_ERROR_STOP=1', '--tuples-only', '--no-align'],
    { encoding: 'utf8', input: sql, stdio: ['pipe', 'pipe', 'pipe'] },
  );
}

function databaseUrl(database) {
  const portLine = execFileSync('docker', [...compose, 'port', 'postgres', '5432'], { encoding: 'utf8' }).trim();
  const port = portLine.match(/:(\d+)$/)?.[1];
  if (!port) throw new Error(`Could not determine test database port from ${portLine}`);
  const url = `postgresql://postgres:postgres@127.0.0.1:${port}/${database}?application_name=codelife-verify`;
  assertIsolatedTestDatabase(url, database);
  return url;
}

function testUrl() {
  return databaseUrl('codelife_test');
}

function assertIsolatedTestDatabase(value, database = 'codelife_test') {
  const url = new URL(value);
  if (url.protocol !== 'postgresql:' || url.hostname !== '127.0.0.1' || url.pathname !== `/${database}`) {
    throw new Error(`Refusing to verify against a non-isolated database: ${url.hostname}${url.pathname}`);
  }
}

const tcc14FoundationMigration = readFileSync('apps/api/prisma/migrations/20260816000000_tcc14_foundation/migration.sql', 'utf8');
const tcc14HardeningMigration = readFileSync('apps/api/prisma/migrations/20260819000000_harden_persistence/migration.sql', 'utf8');
const tcc15Migration = readFileSync('apps/api/prisma/migrations/20260820000000_tcc15_compositional_learning/migration.sql', 'utf8');

const tcc14FixtureSql = `
INSERT INTO "User" ("id", "key", "username", "displayName", "createdAt", "updatedAt")
VALUES ('legacy-user', 'aluna-demo', 'aluna.demo', 'Aluna Demo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "Island" ("id", "key", "title", "sortOrder", "createdAt", "updatedAt")
VALUES ('legacy-island', 'island-3', 'Interatividade', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "Level" ("id", "key", "islandId", "title", "sortOrder", "createdAt", "updatedAt")
VALUES ('legacy-level', 'island-3-l1', 'legacy-island', 'Variáveis JS', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "Slide" ("id", "key", "levelId", "title", "sortOrder", "type", "content", "createdAt", "updatedAt")
VALUES ('legacy-slide', 'island-3-l1-s1', 'legacy-level', 'Variáveis', 0, 'TextText', 'Variáveis permitem armazenar valores para uso posterior.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
`;

function prepareTcc14Database(database, includeProgress) {
  psql('codelife_test', `CREATE DATABASE "${database}";`);
  psql(database, tcc14FoundationMigration);
  psql(database, tcc14HardeningMigration);
  psql(database, tcc14FixtureSql);
  if (includeProgress) {
    psql(database, `INSERT INTO "UserProgress" ("id", "userId", "levelId", "completedAt") VALUES ('legacy-progress', 'legacy-user', 'legacy-level', CURRENT_TIMESTAMP);`);
  }
}

function scalar(database, sql) {
  return psql(database, sql).trim();
}

function expectPsqlFailure(database, sql, expectedMessage) {
  try {
    psql(database, sql);
    throw new Error(`Expected PostgreSQL to reject: ${sql}`);
  } catch (error) {
    const details = error instanceof Error ? `${error.message}\n${error.stderr ?? ''}` : String(error);
    if (!details.includes(expectedMessage)) throw error;
  }
}

function validateTcc15UpgradeScenarios(env) {
  const upgradeDatabase = 'codelife_upgrade_empty';
  prepareTcc14Database(upgradeDatabase, false);
  psql(upgradeDatabase, tcc15Migration);
  runPnpm(['--filter', 'api', 'prisma:seed'], { env: { ...env, DATABASE_URL: databaseUrl(upgradeDatabase) } });
  if (scalar(upgradeDatabase, 'SELECT count(*) FROM "Trail";') !== '1'
    || scalar(upgradeDatabase, 'SELECT count(*) FROM "IslandLevel";') !== '3'
    || scalar(upgradeDatabase, 'SELECT count(*) FROM "LevelSlide";') !== '9'
    || scalar(upgradeDatabase, 'SELECT count(*) FROM "MediaAsset";') !== '3') {
    throw new Error('TCC-15 upgrade did not recreate the controlled 1 × 1 × 3 × 9 composition');
  }
  expectPsqlFailure(
    upgradeDatabase,
    `INSERT INTO "TrailIsland" ("id", "trailId", "islandId", "position") VALUES ('00000000-0000-4000-8000-000000000411', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000301', 0);`,
    'TrailIsland_position_positive',
  );
  expectPsqlFailure(
    upgradeDatabase,
    `INSERT INTO "IslandLevel" ("id", "islandId", "levelId", "position") VALUES ('00000000-0000-4000-8000-000000000611', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000501', 0);`,
    'IslandLevel_position_positive',
  );
  expectPsqlFailure(
    upgradeDatabase,
    `INSERT INTO "LevelSlide" ("id", "levelId", "slideId", "position") VALUES ('00000000-0000-4000-8000-000000000811', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000701', 0);`,
    'LevelSlide_position_positive',
  );
  expectPsqlFailure(
    upgradeDatabase,
    `INSERT INTO "TrailIsland" ("id", "trailId", "islandId", "position") VALUES ('00000000-0000-4000-8000-000000000412', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000301', 1);`,
    'TrailIsland_trailId_position_key',
  );

  const blockedDatabase = 'codelife_upgrade_with_progress';
  prepareTcc14Database(blockedDatabase, true);
  try {
    psql(blockedDatabase, tcc15Migration);
    throw new Error('TCC-15 migration unexpectedly accepted legacy progress');
  } catch (error) {
    const details = error instanceof Error ? `${error.message}\n${error.stderr ?? ''}` : String(error);
    if (!details.includes('legacy UserProgress contains records')) throw error;
  }
  if (scalar(blockedDatabase, 'SELECT count(*) FROM "UserProgress";') !== '1') {
    throw new Error('Blocked TCC-15 migration modified legacy progress');
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
  runPnpm(['--filter', 'api', 'prisma:generate'], { env });
  validateTcc15UpgradeScenarios(env);
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
