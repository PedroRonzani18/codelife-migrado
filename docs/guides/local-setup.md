# Configuração local e validação humana

1. Instale Node 24 e habilite Corepack (`corepack enable`).
2. Execute `pnpm bootstrap`. O comando cria `apps/api/.env` e `apps/web/.env`
   a partir dos exemplos apenas quando os arquivos ainda não existem.
3. Revise a `DATABASE_URL` local, o `JWT_SECRET` de pelo menos 32 caracteres,
   `JWT_ISSUER` e `JWT_AUDIENCE` em `apps/api/.env`; não versione esse arquivo.
   Em `apps/web/.env`, mantenha exclusivamente `VITE_API_URL`, pois variáveis
   `VITE_*` ficam visíveis no bundle do navegador.
4. Execute `pnpm db:up`, `pnpm db:migrate`, `pnpm db:seed` e `pnpm dev`.
5. Abra `http://localhost:5173`, inicie a sessão experimental e confirme visualmente **Interatividade**, três fases e a contagem informada de nove slides.

O login experimental é uma porta deliberadamente estreita: não recebe corpo,
não aceita identificador arbitrário, autentica apenas `aluna.demo` e é recusado
em produção ou sem `EXPERIMENTAL_LOGIN_ENABLED=true`.

Para inspeção da API, abra `http://localhost:3001/docs`. Liveness está em
`/health/live` e readiness do PostgreSQL em `/health/ready`; `/health` continua
como alias. `GET /auth/me` retorna 401 sem cookie e a pessoa da fixture depois
do login experimental. Respostas incluem `x-request-id` para correlação.
