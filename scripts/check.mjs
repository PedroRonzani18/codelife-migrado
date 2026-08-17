import { assertNode24, runPnpm } from './lib/runtime.mjs';
assertNode24();
runPnpm(['--filter', '@codelife/api', 'prisma:generate']);
runPnpm(['lint']);
runPnpm(['typecheck']);
runPnpm(['test']);
runPnpm(['build']);
