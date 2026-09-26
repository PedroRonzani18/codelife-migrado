---
name: codelife-migration-planner
description: Planejar uma intervenção de modernização legado → moderno do CodeLife a partir de Jira, legado, migrado, linha de base, riscos e critérios de avaliação. Produz migration-plan.md e não implementa código funcional.
---

# Planner de migração do CodeLife

Use principalmente no chat de planejamento, depois do gate G0. Este skill
decide o que migrar, por que, o que preservar ou adaptar, qual estratégia e
como a intervenção será avaliada. Não edita código funcional nem substitui as
Skills especialistas.

## Entradas obrigatórias

Receba uma URL/ID do card Jira ou contexto equivalente já fornecido na
conversa. Sem isso, pare antes do planejamento substantivo e solicite o link;
não invente um card. Use [jira-workflow.md](../codelife-project-context/references/jira-workflow.md)
para acesso, fallback e rastreabilidade.

Leia progressivamente:

1. `codelife-project-context` e o mapa necessário;
2. `AGENTS.md` raiz e os `AGENTS.md` das superfícies afetadas;
3. `.codex/context/current-contract.md` e `decision-index.md` como contexto
   atual e roteador de decisões, sem transformar contrato histórico de outra
   migração em autoridade universal;
4. somente ADRs, roadmap e evidências apontados pelo índice;
5. [methodology.md](../codelife-project-context/references/methodology.md) e
   [planning-checklist.md](references/planning-checklist.md).

Analise o card e relações relevantes quando houver acesso. Analise o código e
documentação do legado disponível, a versão atual do migrado e a linha de base
pertinente. Separe comportamento funcional observado de decisão de
implementação legada e marque inferências e limitações.

## Decisões que o plano precisa fechar

Classifique o delta legado → alvo em `PRESERVAR`, `ADAPTAR`, `SUBSTITUIR`,
`REMOVER`, `CRIAR` e `FORA DO ESCOPO`. Identifique ator, pré-condições,
resultado, dados, contratos, integrações, autorização e comportamentos
implícitos relevantes.

Avalie, apenas quando materialmente aplicável, fonte de verdade, coexistência,
cutover, importação de dados, compatibilidade temporária e rollback. Analise
dependências, impactos e riscos. Escolha a estratégia com base no diagnóstico,
critérios e viabilidade; não copie arquitetura legada nem introduza abstrações
por preferência tecnológica.

Ao propor arquitetura, verifique primeiro padrões atuais, `AGENTS.md`, ADRs e
decisões anteriores. Use `codelife-architecture-review` quando houver nova
fronteira, reorganização estrutural, persistência, contrato ou decisão relevante.
Não carregue `codelife-nest-endpoint` ou `codelife-frontend-validation` só para
planejar; apenas indique-os nas macroetapas quando aplicáveis.

## Saída e Gate G1

Produza `docs/migrations/<migration-slug>/migration-plan.md`, sem criar uma
implementação. O documento deve conter: identificação/Jira, objetivo, escopo,
fora do escopo, legado, migrado, linha de base, delta, dependências, riscos,
estratégia, source of truth/coexistência/cutover/rollback quando aplicável,
arquitetura-alvo, decisões `DEC-*`, aceite, validação, evidências, rastreabilidade
e bloqueios efetivos.

Conclua com uma autoauditoria G1 usando
[planning-checklist.md](references/planning-checklist.md). O plano só está
pronto quando for executável, justificado, rastreável e suficiente para o
Roadmap sem que ele precise reinventar decisões.
