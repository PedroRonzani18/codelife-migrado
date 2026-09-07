# Comandos do repositório

Execute os comandos a partir da raiz, com Node 24 e pnpm 11.22.0.

| Comando | Finalidade |
| --- | --- |
| `pnpm bootstrap` | Instala conforme o lockfile, cria `apps/api/.env` e `apps/web/.env` somente se ausentes e gera o cliente Prisma. |
| `pnpm dev` | Inicia API e web pelo Turborepo. |
| `pnpm db:up` / `db:down` | Sobe ou encerra somente o PostgreSQL local em `localhost:5434`. |
| `pnpm db:migrate` / `db:seed` | Aplica migrations e fixture no `DATABASE_URL` local configurado. Confira a URL antes de executar. |
| `pnpm users:promote-admin --key <user-key>` | Promove explicitamente o usuário identificado pela chave pública a `ADMIN`; não há alvo padrão nem regra de email em runtime. |
| `pnpm lint`, `typecheck`, `test`, `build` | Gates individuais dos workspaces. |
| `pnpm test:api:cov` | Testes unitários da API com threshold global mínimo de 80%. |
| `pnpm check` | Gate sem Docker: geração Prisma, lint, tipos, testes unitários e build. |
| `pnpm verify` | Cria um PostgreSQL temporário chamado `codelife_test`, aplica migration/seed, executa integração e E2E (inclusive capturas visuais desktop/mobile em `apps/web/test-results/`) e remove apenas os recursos Compose que criou. |

`verify` valida host e nome do banco, não usa a URL local da pessoa usuária e
não compartilha volume, porta da API/web ou projeto Compose persistente. O seed
é executado duas vezes para provar idempotência. A falha em um gate não deve ser
ocultada.

Antes do primeiro `pnpm verify`, instale o navegador de testes com
`pnpm --filter web exec playwright install chromium`.

As capturas visuais do E2E são anexadas aos artefatos de
`apps/web/test-results/`, que
não é versionado. Preserve-as no sistema de CI quando precisar anexá-las a uma
revisão ou relatório.
