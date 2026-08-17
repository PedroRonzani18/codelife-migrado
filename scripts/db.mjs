import { assertNode24, run, runPnpm } from './lib/runtime.mjs';

const command = process.argv[2];
const compose = ['compose', '-f', 'apps/api/docker-compose.yml'];
const commands = {
  up: () => run('docker', [...compose, 'up', '--detach', '--wait']),
  down: () => run('docker', [...compose, 'down']),
  status: () => run('docker', [...compose, 'ps']),
  migrate: () => runPnpm(['--filter', '@codelife/api', 'prisma:migrate:dev']),
  seed: () => runPnpm(['--filter', '@codelife/api', 'prisma:seed']),
};
assertNode24();
if (!commands[command]) throw new Error('Usage: pnpm db:<up|down|status|migrate|seed>');
commands[command]();
