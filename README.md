# CodeLife migrado — jornada experimental

Implementação controlada do recorte experimental `island-3` do CodeLife. A
base entrega uma jornada autenticada com três níveis, nove slides, progresso
persistido por nível, bloqueio sequencial, retomada e conclusão explícita. Ela
não moderniza o produto inteiro, não oferece CMS e não representa validação
universal da metodologia do TCC.

O estado e os limites da implementação estão registrados no
[roadmap do TCC-15](docs/roadmap-implementacao-tcc-15.md), nos [ADRs](docs/adr)
e nas [evidências técnicas](docs/evidence/tcc-15-validation.md).

## Pré-requisitos

- Node.js 24;
- Corepack e pnpm 11.22.0;
- Docker Compose para banco local e `pnpm verify`.

## Início rápido

```bash
corepack enable
pnpm bootstrap
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`pnpm bootstrap` cria `apps/api/.env` e `apps/web/.env` a partir dos arquivos
`.env.example` correspondentes, apenas quando ainda não existirem. Segredos e
infraestrutura pertencem ao arquivo da API; no web só podem existir variáveis
`VITE_*`, que são públicas no bundle do browser.

Abra `http://localhost:5173`. Em desenvolvimento, o botão **Iniciar sessão
experimental** cria uma sessão apenas para a pessoa seed `aluna.demo`. Em
produção esse mecanismo é recusado pelo servidor.

A API expõe liveness em `/health/live`, readiness do PostgreSQL em
`/health/ready` e Swagger em `/docs` somente quando `SWAGGER_ENABLED=true`.
Erros e logs são correlacionados por `x-request-id` sem expor detalhes internos.

Consulte [a configuração local](docs/guides/local-setup.md), os
[comandos](docs/guides/commands.md) e os [ADRs](docs/adr).
