---
name: codelife-migration-roadmap
description: Decompor um migration-plan aprovado do CodeLife em macroetapas ordenadas, executáveis e validáveis, com dependências, escopo, testes e limites de escalonamento. Não implementa código funcional.
---

# Roadmap de migração do CodeLife

Use principalmente no chat de planejamento, depois de um
`migration-plan.md` aprovado. O Planner decide; este skill detalha a ordem
exata de execução. Não refaça o planejamento, não introduza arquitetura
silenciosa e não edite código funcional.

## Entradas e leitura

Leia o `migration-plan.md`, o contexto G0 necessário, os `AGENTS.md` das áreas
que cada macroetapa afetará e [macrostep-template.md](references/macrostep-template.md).
Consulte Skills especialistas apenas para rotear trabalho: não copie seu
conteúdo. Se o plano contradizer uma decisão existente, pare e registre a
contradição para o Planner; não a resolva implicitamente no Roadmap.

## Decomposição

Crie `docs/migrations/<migration-slug>/roadmap/01-<slug>.md` e demais arquivos
necessários. Uma macroetapa deve ser unidade coerente de implementação e
validação: nem tarefa microscópica nem “implemente tudo”. Use somente as
categorias que o plano exigir, como domínio, persistência, API, contratos,
frontend, integração e testes.

Para cada etapa declare `requires`, `produces` e `unlocks` (ou equivalente),
estado antes/depois, escopo exato, fora do escopo, decisões já tomadas,
arquivos/áreas esperadas, passos, testes, comandos, aceite, evidências e
condições de escalonamento. Uma etapa deve liberar a próxima sem depender de
conhecimento perdido no chat.

Indique explicitamente as Skills aplicáveis:

- `codelife-nest-endpoint` para endpoint, módulo Nest, contrato público ou
  persistência ligada à API;
- `codelife-frontend-validation` para tela, rota, fluxo, integração, estados,
  acessibilidade ou responsividade;
- `codelife-architecture-review` quando a decisão/revisão estrutural prevista
  pelo plano exigir assurance arquitetural.

Não obrigue `codelife-change-contract` em migração formal: o plano e a
macroetapa já são o contrato autoritativo.

## Gate G2

Audite se as etapas estão ordenadas, têm dependências explícitas, critérios
objetivos, testes, escopo e fora do escopo claros, Skills especialistas
roteadas e nenhuma decisão estrutural relevante deixada para o Executor.
Entregue o roadmap somente quando o Executor puder receber uma macroetapa por
vez.
