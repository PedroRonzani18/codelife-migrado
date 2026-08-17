# Evidências esperadas — TCC-14

| Afirmação observável | Mecanismo |
| --- | --- |
| Estrutura reproduzível | `pnpm bootstrap`, `pnpm check` e documentação local. |
| Banco separado | `pnpm verify`, que cria e remove projeto Compose próprio. |
| Fixture 1 × 3 × 9 | Seed idempotente e teste de integração em `apps/api/test/fixture.integration-spec.ts`. |
| Sessão experimental delimitada | Teste de `GET /auth/me` sem cookie e login sem identificador de entrada. |
| Contratos consistentes | Schemas Zod em `packages/contracts` usados pela API e validados pelo web. |

Esta tabela descreve instrumentos de verificação, não resultados de avaliação
comparativa da modernização. Esses resultados dependem do TCC-15 e da coleta
posterior.
