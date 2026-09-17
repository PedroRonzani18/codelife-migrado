# Comandos reais do CodeLife migrado

Execute a partir da raiz, com Node 24 e pnpm 11.22.0. Consulte os manifests se
um script mudar; esta referência resume os comandos presentes no repositório.

## Rápidos e incrementais

```text
pnpm --filter @codelife/contracts lint
pnpm --filter @codelife/contracts typecheck
pnpm --filter @codelife/contracts test
pnpm --filter @codelife/contracts build
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api test:integration
pnpm --filter api build
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web test:e2e
pnpm --filter web build
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Use o filtro da área alterada durante o ciclo local. Mudança em contrato
compartilhado exige validar contratos e os consumidores API/web afetados.

## Gates

```text
pnpm check
pnpm test:api:cov
pnpm verify
pnpm test:web:e2e
```

`pnpm check` executa geração Prisma, lint, tipos, testes unitários e build sem
Docker. `pnpm verify` cria banco PostgreSQL temporário isolado, aplica migration,
executa o seed duas vezes, integração, `check` e E2E e remove os recursos
Compose que criou. Não oponha uma URL local ou banco de usuário ao verify.
Antes do primeiro uso, o próprio guia pede:
`pnpm --filter web exec playwright install chromium`.

## Desenvolvimento e Prisma

```text
pnpm bootstrap
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm db:status
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm db:down
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate:dev
pnpm --filter api prisma:migrate:deploy
pnpm --filter api prisma:seed
```

`db:migrate`, `db:seed` e comandos Prisma exigem conferir a origem e o nome do
banco conforme `apps/api/prisma/AGENTS.md`. Não use reset, limpeza ou alteração
de dados reais. Migration/seed/schema sempre exigem o gate `pnpm verify` quando
a mudança for encerrada.

As fontes canônicas são `package.json`, os `package.json` dos workspaces,
`scripts/check.mjs`, `scripts/verify.mjs` e `docs/guides/commands.md`.
