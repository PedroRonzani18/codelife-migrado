import { existsSync, lstatSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const apiRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(apiRoot, 'dist');

if (dist !== `${apiRoot}/dist`) throw new Error('Refusing to clean an unexpected path');
if (existsSync(dist)) {
  const stats = lstatSync(dist);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new Error('Refusing to clean a non-directory or symbolic-link dist path');
  }
  rmSync(dist, { recursive: true, force: false });
}
