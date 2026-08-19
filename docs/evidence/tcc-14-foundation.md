# Evidências de implementação — TCC-14

| Afirmação observável | Mecanismo |
| --- | --- |
| Estrutura reproduzível | `pnpm bootstrap`, `pnpm check` e documentação local. |
| Banco separado | `pnpm verify`, que cria e remove projeto Compose próprio. |
| Fixture 1 × 3 × 9 | Seed idempotente e teste de integração em `apps/api/test/fixture.integration-spec.ts`. |
| Sessão experimental delimitada | Teste de `GET /auth/me` sem cookie e login sem identificador de entrada. |
| Contratos consistentes | Schemas Zod em `packages/contracts` usados pela API e validados pelo web. |

## Resultado da execução local

Execução realizada em 19 de agosto de 2026:

- `pnpm check`: aprovado (lint, typecheck, testes unitários e builds);
- `pnpm test:api:cov`: 15 suítes e 60 testes aprovados, com 95,47% de
  statements, 90,32% de branches, 87,75% de functions e 94,65% de lines;
- `pnpm audit`: nenhuma vulnerabilidade conhecida após a atualização das
  dependências e dos overrides transitivos;
- `pnpm verify`: aprovado com PostgreSQL temporário, migrations em banco novo,
  seed executado duas vezes, teste de integração, API compilada, aplicação web
  e cenário Playwright;
- o fluxo de verificação removeu os containers e a rede que criou ao terminar.

Também foi validado separadamente o upgrade de um banco previamente povoado:
os timestamps foram preenchidos e as novas restrições impediram remoções em
cascata da árvore de aprendizado.

A validação visual manual de cinco minutos não foi executada. Antes de encerrar
o card, os workflows do GitHub precisam concluir com sucesso no PR.

Estas evidências demonstram a implementação e a reprodutibilidade técnica da
fundação. Elas não constituem resultados de avaliação comparativa da
modernização; esses resultados dependem do TCC-15 e da coleta posterior.
