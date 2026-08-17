import { spawnSync } from 'node:child_process';

export function assertNode24() {
  if (Number(process.versions.node.split('.')[0]) !== 24) {
    throw new Error(`Node.js 24 is required; found ${process.version}`);
  }
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
}

// The workspace `packageManager` pin makes the Corepack shim select pnpm 10.
// Calling the shim directly also keeps nested Turbo commands on the same binary.
export function runPnpm(args, options) { run('pnpm', args, options); }
