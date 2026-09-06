---
name: codelife-nest-endpoint
description: Implementar ou revisar endpoints Nest do CodeLife migrado, incluindo contrato público, módulos por capacidade, regras de domínio, persistência e consumidores coordenados.
---

# Implementação de endpoint Nest

Use este skill quando uma tarefa criar ou alterar um endpoint da API, um módulo
Nest, uma capacidade de negócio, uma operação de persistência ou o contrato
consumido pelo web.

Este skill organiza a execução técnica. Ele não decide regra de negócio,
escopo acadêmico, comportamento do legado ou uma nova capacidade por inferência.

## Leitura mínima

1. Leia `AGENTS.md`, `.codex/context/current-contract.md` e
   `.codex/context/decision-index.md`.
2. Leia `apps/api/AGENTS.md` e `packages/contracts/AGENTS.md`.
3. Carregue somente os ADRs e trechos do roadmap indicados pelo índice para a
   capacidade afetada.
4. Inspecione o módulo, contrato, controller, service, repository e testes
   existentes mais próximos antes de criar arquivos.
5. Verifique `git status --short --branch` e preserve alterações locais.

## Contrato antes da implementação

Declare:

- objetivo observável e fora de escopo;
- comando ou consulta representado pelo endpoint;
- request, response, códigos de erro e comportamento de idempotência;
- autenticação, autorização e invariantes de domínio;
- consumidor web ou outro consumidor afetado;
- impacto esperado em schema, migration, seed e dados existentes;
- validação mínima, validação de encerramento e riscos pendentes.

Se uma regra estiver ambígua ou exceder o contrato atual, pare no planejamento
e peça direção. Não complete a lacuna com uma decisão implícita no código.

## Fluxo de implementação

1. Confirme a capacidade de negócio dona do endpoint e o contrato público.
2. Atualize `packages/contracts` quando a superfície compartilhada mudar.
3. Organize a implementação na capacidade correta, mantendo controller, service,
   repository, ports, providers e testes coesos.
4. Mantenha controllers limitados à adaptação HTTP, autenticação e validação.
5. Coloque comandos, transições, políticas e erros de domínio no service.
6. Mantenha Prisma dentro do repository e atrás de port tipado quando houver
   uma fronteira consumida pelo service.
7. Crie migration ou seed somente quando a necessidade persistente estiver
   confirmada. Migrations aplicadas não devem ser editadas.
8. Atualize OpenAPI, testes e consumidores coordenadamente quando o endpoint
   for público.

## Limites arquiteturais

- Não crie camada global ou módulo técnico apenas para acomodar o endpoint.
- Não crie interfaces espelhadas para cada service ou repository sem uma
  fronteira real de injeção, teste ou domínio.
- Não exponha tipos Prisma em `packages/contracts` ou na resposta HTTP.
- Não coloque transformação de dados legados, importação em massa ou lógica de
  reconciliação dentro de services de runtime; mantenha-a em `tools/migration`
  ou `scripts/migration` da fatia correspondente.
- Não altere a hierarquia, o progresso ou a fonte de verdade sem decisão
  registrada.

## Validação proporcional

Durante a implementação, execute somente as verificações rápidas e relevantes
para o trecho alterado. Ao fechar uma fatia:

- contrato público: valide contratos e consumidores API/web;
- regra de negócio, guard ou service: valide testes unitários pertinentes;
- consulta, relação ou persistência: inclua teste de integração quando
  aplicável;
- schema, migration, seed ou progresso: use `pnpm verify`;
- endpoint consumido pelo web: valide também o fluxo integrado ou registre a
  validação pendente.

Nunca informe uma validação como concluída sem executá-la. Se os testes forem
deixados para uma etapa posterior, registre o comando e o risco residual.

## Encerramento

Relate:

- arquivos e contratos alterados;
- endpoint e comportamento entregue;
- consumidores afetados;
- validações executadas e pendentes;
- decisões tomadas, suposições e riscos residuais.

Não faça commit, push, Pull Request ou publicação sem autorização explícita.
