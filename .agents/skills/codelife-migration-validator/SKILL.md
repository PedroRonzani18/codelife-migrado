---
name: codelife-migration-validator
description: Coletar evidências reais ou revisar uma migração do CodeLife contra migration-plan, roadmap, execução e Etapa 6 do TCC, incluindo smoke tests, automação, comparação e relatório Jira-ready.
---

# Validator de migração do CodeLife

Use este skill em um dos modos explícitos:

- `COLLECT`, principalmente no chat de implementação/local, para executar
  verificações e produzir evidência real;
- `REVIEW`, principalmente no chat de planejamento, para auditar a
  intervenção e decidir se a Etapa 6 foi satisfeita.

Depois de uma coleta, não confunda “há um relatório” com “a evidência passou”.
Leia [evidence-contract.md](references/evidence-contract.md) e use
[validation-report-template.md](references/validation-report-template.md).

## COLLECT — G5

Derive a matriz de validação do `migration-plan.md`, roadmap, execution reports,
critérios de aceite e comportamento legado relevante. Inspecione o código e
execute comandos reais do projeto. Colete, conforme aplicável, contratos,
testes, lint, typecheck, build, banco, integração, API, web, autenticação,
autorização e regressões.

Smoke test é evidência operacional distinta de teste unitário. Adapte o roteiro
ao módulo: subida dos serviços, endpoint, fluxo principal, proteção de rota,
sessão, persistência, consumo web e tratamento observável de erro quando
existirem. Use `codelife-nest-endpoint` para critérios de endpoint/backend e
`codelife-frontend-validation` para fluxo, estados, acessibilidade,
responsividade e integração UI/API, sem reimplementar a feature.

Registre cada item como `PASS`, `FAIL`, `NOT RUN`, `NOT APPLICABLE` ou
`BLOCKED`, sempre com comando/cenário, resultado, ambiente e limitação. Crie
somente artefatos de evidência ou testes auxiliares necessários; não corrija
funcionalidade durante a coleta sem retornar ao Executor.

## REVIEW — G6

Audite `migration-plan.md`, roadmap, execution reports e `evidence/`. Não
presuma terminal local. Confronte Etapa 4 planejada, implementação realizada e
Etapa 6 comprovada:

- preservação, adaptação deliberada e regressões;
- aderência ao escopo e critérios de aceite;
- desvios e riscos materializados;
- arquitetura planejada versus resultante, usando
  `codelife-architecture-review` quando a mudança for estrutural;
- qualidade, comparabilidade, suficiência e lacunas das evidências;
- decisão de continuidade ou encerramento do escopo.

Classifique o resultado como `VALIDADA`, `VALIDADA COM RESSALVAS` ou
`NÃO VALIDADA`. Não transforme build/lint em prova funcional, smoke em unit
test, evidência contextual em melhoria comparativa ou `PASS` em algo não
executado. Produza texto Jira-ready somente quando solicitado.
