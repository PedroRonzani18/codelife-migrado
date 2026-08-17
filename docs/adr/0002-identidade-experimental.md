# ADR 0002 — Identidade experimental por cookie JWT

**Contexto.** A fundação precisa de uma pessoa estável para a fixture, sem
ampliar o escopo para contas reais.

**Decisão.** O seed cria somente `aluna.demo`; um endpoint sem corpo emite JWT
em cookie HttpOnly apenas com flag explícita e em desenvolvimento/teste.

**Alternativas.** OAuth, cadastro e senha foram excluídos. Um ID enviado pelo
cliente violaria o limite de identidade do TCC-11.

**Consequências.** `GET /auth/me` distingue sessão ausente de válida. Segredo,
duração, CORS e atributos do cookie passam pela validação centralizada.
