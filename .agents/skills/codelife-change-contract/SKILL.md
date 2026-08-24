---
name: codelife-change-contract
description: Planejar ou implementar uma feature, correção funcional ou alteração de comportamento no CodeLife migrado preservando o recorte experimental, as decisões registradas e a validação proporcional.
---

# Contrato de mudança do CodeLife

Use este skill antes de editar código para feature, bug, endpoint, fluxo de
interface, contrato, persistência ou documentação comportamental.

## Leitura mínima

1. Leia `AGENTS.md`, `.codex/context/current-contract.md` e
   `.codex/context/decision-index.md`.
2. Identifique as linhas do índice afetadas e leia apenas as fontes apontadas.
3. Verifique `git status --short --branch` antes de planejar escrita.

## Contrato antes da edição

Declare de forma curta:

- objetivo observável;
- dentro e fora de escopo;
- invariantes e decisões carregadas;
- arquivos e consumidores afetados;
- validação mínima e evidência/documentação necessária;
- riscos ou informação que depende do usuário.

Se uma mudança contrariar o contrato atual ou criar uma nova capacidade fora do
recorte, não a implemente por inferência: proponha alternativas e peça direção.

## Durante a implementação

- Faça a menor alteração que satisfaça o contrato.
- Atualize API, contratos e web de forma coordenada quando a superfície pública
  mudar.
- Preserve alterações locais não relacionadas.
- Não faça commit, push, PR, alteração em Jira ou publicação sem autorização
  explícita na conversa atual.

## Encerramento

Relate arquivos alterados, comportamento entregue, validações executadas e
riscos residuais. Atualize roadmap, ADR ou evidência apenas quando a mudança
realmente alterar escopo, decisão ou comportamento validado.
