---
name: codelife-project-context
description: Fornecer contexto factual e roteamento para migrações do CodeLife, incluindo mapa do repositório, metodologia do TCC, comandos, artefatos e Jira. Não implementa código de migração.
---

# Contexto compartilhado do CodeLife

Use este skill como o gate G0 antes de planejar, decompor, executar ou revisar
uma migração formal do CodeLife migrado. Ele fornece um índice factual; não é
um segundo `AGENTS.md` e não decide a arquitetura específica da intervenção.

## Autoridade e leitura progressiva

As regras normativas vêm do `AGENTS.md` aplicável, nesta ordem de proximidade:

- `AGENTS.md` na raiz do repositório;
- `apps/api/AGENTS.md` para backend;
- `apps/api/prisma/AGENTS.md` para schema, migration, seed ou banco;
- `apps/web/AGENTS.md` para frontend;
- `packages/contracts/AGENTS.md` para shapes públicos compartilhados.

Leia somente a referência necessária ao trabalho atual:

- [repository-map.md](references/repository-map.md) para localizar fontes e
  fronteiras;
- [methodology.md](references/methodology.md) ao tratar Etapa 4 ou Etapa 6;
- [migration-artifacts.md](references/migration-artifacts.md) ao criar ou
  revisar documentos de uma migração;
- [commands.md](references/commands.md) ao escolher verificações locais;
- [jira-workflow.md](references/jira-workflow.md) ao receber ou preparar
  rastreabilidade de card.

Se uma referência factual divergir do repositório ou de um `AGENTS.md`, registre
a divergência e siga o estado atual observável e a autoridade normativa. Não
invente caminhos, acesso ao Jira, comportamento legado ou resultados de
execução.

## Saída do gate G0

Entregue um contexto curto com: fontes disponíveis, áreas afetadas, autoridades
que precisam ser lidas, limitações de acesso e comandos relevantes. Não altere
código funcional, não crie uma migração e não trate branch, hash, contagem de
testes ou estado momentâneo como conhecimento permanente.
