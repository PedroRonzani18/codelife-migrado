# ADR 0002 — Identidade experimental por cookie JWT

**Contexto.** A fundação precisa de uma pessoa estável para a fixture, sem
ampliar o escopo para contas reais.

**Decisão.** O seed cria somente `aluna.demo`; um endpoint sem corpo emite JWT
HS256 com emissor, audiência e expiração explícitos em cookie HttpOnly apenas
com flag explícita e em desenvolvimento/teste. O login possui limitação local
de tentativas. Requisições mutáveis que já carreguem a sessão devem apresentar
a origem web configurada, reduzindo exposição a CSRF antes do TCC-15.

**Alternativas.** OAuth, cadastro e senha foram excluídos. Um ID enviado pelo
cliente violaria o limite de identidade do TCC-11.

**Consequências.** `GET /auth/me` distingue sessão ausente de válida. Segredo
com pelo menos 32 caracteres, duração, emissor, audiência, CORS e atributos do
cookie passam pela validação centralizada. O guard consulta a identidade por um
repository, sem acoplar autenticação diretamente ao Prisma.
