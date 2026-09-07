# Validação e evidências de implementação — TCC-30

**Execução do gate:** 07 de setembro de 2026, branch `FT/TCC-30`, commit de
código/testes `0ce9e1c`.

Esta evidência consolida somente o comportamento técnico observado no recorte
experimental de gestão mínima de usuários, autorização e jornada autenticada.
Ela não representa validação universal do CodeLife, eficácia pedagógica ou
avaliação acadêmica do TCC-31.

## Escopo validado

- papéis persistidos `USER | ADMIN`;
- autorização administrativa no backend;
- listagem de usuários e alteração exclusiva de role;
- sessão `/auth/me` refletindo a role atual;
- preservação de identidade externa e progresso;
- jornada `island-3` com três níveis e nove slides;
- frontend administrativo acessível somente para ADMIN.

CRUD de usuário, conteúdo administrativo, novos papéis, suspensão, exclusão,
paginação, filtros, audit log, deploy e pentest permanecem fora do escopo.

## Matriz de rastreabilidade

| Critério | Implementação/evidência | Resultado observado |
| --- | --- | --- |
| USER é default | migration `20260906000000_tcc30_user_roles`; upgrade em `scripts/verify.mjs` | `USER` aplicado a usuário existente em base limpa. |
| ADMIN controla a gestão | `apps/api/src/users/admin`; `apps/api/src/users/management`; integração e E2E | listagem e alteração autorizadas apenas para ADMIN. |
| USER recebe 403 | `apps/api/test/admin-users.integration-spec.ts`; `apps/web/e2e/admin-users.spec.ts` | API bloqueia acesso; web redireciona sem expor a tela. |
| Ausência de sessão recebe 401 | testes de auth, progresso e admin | `/auth/me`, admin GET/PATCH e progresso retornam `401` sem sessão. |
| Promoção sem nova identidade | `apps/api/test/admin-users.integration-spec.ts` | mesma sessão passa a ADMIN; `User.id/key`, `ExternalIdentity` e progresso permanecem. |
| Rebaixamento remove acesso | `apps/api/test/admin-users.integration-spec.ts` | mesma sessão passa a USER; admin retorna `403`; dados permanecem. |
| Auto-rebaixamento impedido | service unitário e integração admin | retorna `403`; ADMIN continua ADMIN. |
| Google auth preservada | `google-auth.integration-spec.ts`, `google-auth-progress.integration-spec.ts`, E2E foundation | stub cobre login, logout, relogin, claims não autoritativas e progresso. Google real não foi executado. |
| Aprendizagem sem regressão | `progress.integration-spec.ts`; `foundation.spec.ts` | sequência, cursor, conclusão, desbloqueio, persistência e isolamento passaram. |
| Contratos API/web sincronizados | `packages/contracts/src/auth.ts`, `users.ts`, consumers API/web | shapes de role, sessão, listagem e alteração compartilhados e validados. |

## Gates quantitativos

O `pnpm verify` executado no commit `0ce9e1c` concluiu:

| Gate | Resultado |
| --- | --- |
| API unitária | 30 suites / 132 testes |
| Contracts | 1 arquivo / 8 testes |
| Web unitário | 9 arquivos / 23 testes |
| API integração | 12 suites / 26 testes |
| E2E | 4 cenários |
| Migrations | 6 aplicadas em `codelife_test` |
| Seed | duas execuções idempotentes no banco principal; uma no cenário de upgrade |
| Lint, typecheck e build | concluídos |
| `pnpm check` | concluído |

O banco PostgreSQL, as portas da API/web e os volumes foram temporários e
removidos pelo próprio `verify` ao final.

## Desvios e limitações

| Planejado | Implementado | Motivo |
| --- | --- | --- |
| Bootstrap administrativo controlado | script explícito por chave pública | evita promoção por email, claim externo ou seed. |
| E2E USER e ADMIN com execução determinística | ADMIN pelo mecanismo experimental existente; USER por JWT de fixture efêmera | não depende de credenciais reais Google e não adiciona login experimental ao produto. |
| Smoke Google real | não executado | credenciais externas não estavam disponíveis; fica como evidência complementar para TCC-31. |

Riscos residuais: validação restrita ao ambiente local; ausência de deploy,
pentest e audit log; somente dois papéis; recuperação de administradores fora do
endpoint; listagem sem paginação; e aviso de depreciação do `pg` durante o
seed. Nenhum desses itens foi ampliado nesta fatia.

## Referência complementar

O registro operacional completo, incluindo fronteiras arquiteturais, contexto
atualizado e matriz de conclusão, está em
`docs/current-implementation/06-macroetapa-gates-e-evidencias-tcc31.md`.
