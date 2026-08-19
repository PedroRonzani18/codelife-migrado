# CodeLife migrado — fundação experimental

Implementação controlada da fundação do recorte experimental `island-3` do
CodeLife. Esta base é deliberadamente limitada: prepara o monorepo, os
contratos, a fixture e a identidade experimental para a jornada vertical do
card TCC-15. Ela não moderniza o produto inteiro nem implementa liberação e
conclusão da trilha.

## Pré-requisitos

- Node.js 24;
- Corepack e pnpm 10.33.0;
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
