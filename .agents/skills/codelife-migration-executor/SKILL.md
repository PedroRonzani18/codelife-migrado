---
name: codelife-migration-executor
description: Executar uma macroetapa aprovada da migração do CodeLife no repositório local, seguindo AGENTS.md, Skills especialistas, validação proporcional e relatório de execução. Escalona decisões não resolvidas.
---

# Executor de migração do CodeLife

Use principalmente no chat de implementação/Codex local, recebendo uma única
macroetapa aprovada por vez. O Executor é responsável por implementar,
verificar e relatar; não é a autoridade principal de arquitetura.

## Pre-flight obrigatório

Antes de editar:

1. leia a macroetapa, o `migration-plan.md` relacionado e as referências
   necessárias;
2. leia o `AGENTS.md` raiz e o mais próximo de cada superfície afetada;
3. identifique Skills especialistas indicadas pela macroetapa;
4. confira branch, `git status --short --branch`, pré-condições e dependências;
5. inspecione o estado real e compare-o com a especificação;
6. registre mentalmente ou no relatório as alterações pré-existentes; não as
   reverta, mova ou sobrescreva.

Durante migração formal, `migration-plan.md` e a macroetapa ativa substituem
um change contract duplicado. Ao trabalhar em endpoint Nest, use
`codelife-nest-endpoint`; ao trabalhar em UI/fluxo, use
`codelife-frontend-validation`; em mudança estrutural prevista, use
`codelife-architecture-review` conforme o plano.

## Implementação disciplinada

Implemente somente o escopo da macroetapa. Pode resolver detalhes locais e
falhas mecânicas — tipos, imports, mocks, lint, sintaxe e testes — sem retornar
ao Planner. Não transforme uma falha mecânica em bloqueio arquitetural.

Se surgir uma decisão não resolvida que altere arquitetura, regra de negócio,
contrato público, schema, semântica, escopo, estratégia, segurança,
comportamento legado ou dependência estrutural, pare a alteração dependente e
produza:

```text
ARCHITECTURAL DECISION REQUIRED
- problema:
- evidência:
- por que o plano não resolve:
- impacto:
- opções plausíveis:
- recomendação, se houver:
- decisão necessária:
```

O encaminhamento é Executor → chat de planejamento → decisão registrada →
plano/roadmap atualizado → Executor continua.

## Ciclo e limites de segurança

Siga, adaptando aos comandos reais do projeto:

```text
READ → IMPLEMENT → FORMAT/LINT → TYPECHECK → TEST → BUILD
→ teste específico → inspecionar diff → comparar com macroetapa
→ corrigir → revalidar → relatar
```

Para Prisma, leia também `apps/api/prisma/AGENTS.md`, preserve migrations
aplicadas, não use reset e só crie migration/seed quando o plano autorizar.
Não modifique dados reais, segredos ou credenciais.

## Encerramento e gate G4

Inspecione o diff procurando arquivos inesperados, código morto, debug, TODOs,
imports inúteis, dependências sem necessidade e artefatos gerados indevidos.
Produza o relatório conforme
[execution-report-template.md](references/execution-report-template.md),
distinguindo alterações pré-existentes, mudanças desta etapa, critérios
atendidos, desvios, pendências e evidências reais. Só marque G4 quando a etapa
estiver pronta para o Validator; falhas ou validações não executadas permanecem
explícitas.
