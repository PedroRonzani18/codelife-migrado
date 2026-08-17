import { existsSync, copyFileSync } from 'node:fs';
import { assertNode24, runPnpm } from './lib/runtime.mjs';

assertNode24();
if (!existsSync('.env')) copyFileSync('.env.example', '.env');
if (existsSync('pnpm-lock.yaml')) runPnpm(['install', '--frozen-lockfile']);
else runPnpm(['install']);
runPnpm(['--filter', '@codelife/api', 'prisma:generate']);
runPnpm(['--filter', '@codelife/contracts', 'build']);
