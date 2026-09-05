import { existsSync, copyFileSync } from 'node:fs';
import { assertNode24, runPnpm } from './lib/runtime.mjs';

assertNode24();
const environmentFiles = [
  ['apps/api/.env.example', 'apps/api/.env'],
  ['apps/web/.env.example', 'apps/web/.env'],
];
for (const [example, target] of environmentFiles) {
  if (!existsSync(target)) copyFileSync(example, target);
}
if (existsSync('pnpm-lock.yaml')) runPnpm(['install', '--frozen-lockfile']);
else runPnpm(['install']);
runPnpm(['--filter', 'api', 'prisma:generate']);
runPnpm(['--filter', 'contracts', 'build']);
