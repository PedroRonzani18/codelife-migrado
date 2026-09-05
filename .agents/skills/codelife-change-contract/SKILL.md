---
name: codelife-change-contract
description: Executar o pré-voo de uma mudança no CodeLife migrado, preservando escopo, decisões, invariantes e validação proporcional antes da implementação.
---

# Pré-voo de mudança do CodeLife

Use este skill antes de editar código, documentação comportamental, contratos
ou persistência para uma feature, correção, endpoint ou alteração de fluxo.

Esta é uma skill transversal de planejamento. Ela não substitui as skills
técnicas: depois do pré-voo, use a skill especializada da superfície afetada,
como frontend, endpoint ou arquitetura. Não repita aqui detalhes técnicos que
pertencem a essas skills.

## Leitura mínima obrigatória

1. Leia `AGENTS.md`, `.codex/context/current-contract.md` e
   `.codex/context/decision-index.md`.
2. Identifique as linhas do índice afetadas e leia somente as fontes apontadas.
3. Execute `git status --short --branch` antes de planejar qualquer escrita.
4. Identifique a skill técnica necessária:
   - `codelife-frontend-validation` para tela, rota ou fluxo React;
   - `codelife-nest-endpoint` para endpoint, capacidade de API ou persistência;
   - `codelife-architecture-review` para módulos, camadas, abstrações,
     contratos públicos, schema ou migrations.

Para uma mudança estrutural, a revisão arquitetural vem antes da implementação.
Para mudanças de frontend ou API, encaminhe o resumo deste pré-voo à skill
especializada correspondente.

## Resumo do contrato antes da edição

Declare de forma curta, sem detalhar a implementação:

- objetivo observável;
- dentro e fora de escopo;
- invariantes e decisões carregadas;
- superfícies e consumidores potencialmente afetados;
- validação mínima e evidência ou documentação necessária;
- riscos, ambiguidades ou informação que depende do usuário.

Não invente regra de produto, comportamento do legado, evidência ou resultado.
Não transforme o resumo em um plano técnico completo: a skill especializada
deve detalhar request/response, estados da tela, camadas, testes e comandos
específicos da superfície alterada.

Se uma mudança contrariar o contrato atual ou criar uma nova capacidade fora do
recorte, não a implemente por inferência: proponha alternativas e peça direção.

## Limites durante a implementação

- Faça a menor alteração que satisfaça o contrato.
- Preserve alterações locais não relacionadas.
- Não faça commit, push, PR, alteração em Jira ou publicação sem autorização
  explícita na conversa atual.
- Quando a superfície pública mudar, coordene API, `packages/contracts` e web
  conforme orientado pela skill especializada.

## Encerramento do trabalho

Ao finalizar, relate:

- arquivos e superfícies alterados;
- comportamento entregue;
- validações realmente executadas e as que ficaram pendentes;
- riscos residuais ou decisões ainda necessárias.

Atualize roadmap, ADR ou evidência somente quando a mudança alterar escopo,
decisão ou comportamento validado. A skill especializada continua responsável
por relatar seus detalhes técnicos específicos.
