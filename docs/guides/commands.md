# Comandos do repositório

Execute os comandos a partir da raiz, com Node 24 e pnpm 10.33.0.

| Comando | Finalidade |
| --- | --- |
| `pnpm bootstrap` | Instala conforme o lockfile, cria `.env` somente se ausente e gera o cliente Prisma. |
| `pnpm dev` | Inicia API e web pelo Turborepo. |
| `pnpm db:up` / `db:down` | Sobe ou encerra somente o PostgreSQL local em `localhost:5434`. |
| `pnpm db:migrate` / `db:seed` | Aplica migrations e fixture no `DATABASE_URL` local configurado. Confira a URL antes de executar. |
| `pnpm lint`, `typecheck`, `test`, `build` | Gates individuais dos workspaces. |
| `pnpm check` | Gate sem Docker: geração Prisma, lint, tipos, testes unitários e build. |
| `pnpm verify` | Cria um PostgreSQL temporário chamado `codelife_test`, aplica migration/seed, executa integração e E2E e remove apenas os recursos Compose que criou. |

`verify` não usa a URL local da pessoa usuária e não compartilha volume, porta ou projeto Compose persistente. A falha em um gate não deve ser ocultada.

Antes do primeiro `pnpm verify`, instale o navegador de testes com
`pnpm --filter @codelife/web exec playwright install chromium`.
