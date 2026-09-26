# Contrato de macroetapa

Use este esqueleto como referência e remova seções sem aplicação material:

```markdown
# Macroetapa N — <nome>

Status: PLANEJADA
Requires: <macroetapas/decisões/artefatos>
Produces: <artefatos/estado liberado>
Unlocks: <próxima etapa ou validação>

## Objetivo
## Contexto necessário
## Pré-condições
## Dependências
## Escopo exato
## Fora do escopo
## Estado esperado antes
## Estado esperado depois
## Arquitetura a respeitar
## AGENTS.md aplicáveis
## Skills especialistas aplicáveis
## Backend
## Frontend
## Prisma / persistência
## Contratos
## Integrações
## Arquivos / áreas esperadas
## Comportamentos obrigatórios
## Decisões já tomadas
## Restrições
## Não fazer
## Passos de implementação
## Testes obrigatórios
## Comandos relevantes
## Critérios de aceite
## Evidências de conclusão
## Condições que exigem escalonamento ao Planner
```

## Limite do Executor

O Executor pode escolher detalhes mecânicos locais, como nomes, helpers pequenos,
mocks e correções de lint. Deve escalar uma decisão que mude arquitetura, regra
de negócio, contrato público, schema, semântica, escopo, estratégia, segurança,
comportamento legado ou dependência estrutural.

Inclua na macroetapa as restrições negativas que previnem scope creep, por
exemplo: não criar provider adicional, não refatorar capacidade não incluída,
não antecipar etapa seguinte e não introduzir abstração genérica sem decisão.

## Gate G3

Antes de liberar a etapa, confirme: pré-condições verificáveis, dependências
resolvidas, estado antes/depois observável, arquivos plausíveis, comandos reais,
testes derivados do aceite, evidências exigidas e rota explícita para
`ARCHITECTURAL DECISION REQUIRED`.
