# Comandos do repositório

Execute os comandos a partir da raiz, com Node 24 e pnpm 10.33.0.

| Comando | Finalidade |
| --- | --- |
| `pnpm bootstrap` | Instala conforme o lockfile, cria `apps/api/.env` e `apps/web/.env` somente se ausentes e gera o cliente Prisma. |
| `pnpm dev` | Inicia API e web pelo Turborepo. |
| `pnpm db:up` / `db:down` | Sobe ou encerra somente o PostgreSQL local em `localhost:5434`. |
| `pnpm db:migrate` / `db:seed` | Aplica migrations e fixture no `DATABASE_URL` local configurado. Confira a URL antes de executar. |
| `pnpm lint`, `typecheck`, `test`, `build` | Gates individuais dos workspaces. |
| `pnpm test:api:cov` | Testes unitários da API com threshold global mínimo de 80%. |
| `pnpm check` | Gate sem Docker: geração Prisma, lint, tipos, testes unitários e build. |
| `pnpm verify` | Cria um PostgreSQL temporário chamado `codelife_test`, aplica migration/seed, executa integração e E2E e remove apenas os recursos Compose que criou. |

`verify` valida host e nome do banco, não usa a URL local da pessoa usuária e
não compartilha volume, porta da API/web ou projeto Compose persistente. O seed
é executado duas vezes para provar idempotência. A falha em um gate não deve ser
ocultada.

Antes do primeiro `pnpm verify`, instale o navegador de testes com
`pnpm --filter web exec playwright install chromium`.
