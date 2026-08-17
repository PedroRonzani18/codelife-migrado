# Configuração local e validação humana

1. Instale Node 24 e habilite Corepack (`corepack enable`).
2. Execute `pnpm bootstrap`. O comando copia `.env.example` para `.env` apenas quando o arquivo ainda não existe.
3. Revise a `DATABASE_URL` local e o `JWT_SECRET` em `.env`; não versione esse arquivo.
4. Execute `pnpm db:up`, `pnpm db:migrate`, `pnpm db:seed` e `pnpm dev`.
5. Abra `http://localhost:5173`, inicie a sessão experimental e confirme visualmente **Interatividade**, três fases e a contagem informada de nove slides.

O login experimental é uma porta deliberadamente estreita: não recebe corpo,
não aceita identificador arbitrário, autentica apenas `aluna.demo` e é recusado
em produção ou sem `EXPERIMENTAL_LOGIN_ENABLED=true`.

Para inspeção da API, abra `http://localhost:3001/docs`; o health check está em
`http://localhost:3001/health`. `GET /auth/me` retorna 401 sem cookie e a pessoa
da fixture depois do login experimental.
