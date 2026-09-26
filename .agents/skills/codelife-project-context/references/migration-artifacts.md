# Artefatos e gates de uma migração formal

## Estrutura padrão

Quando não existir convenção equivalente para a migração, use:

```text
docs/migrations/<migration-slug>/
├── migration-plan.md
├── roadmap/
│   ├── 01-<macrostep>.md
│   └── ...
├── execution/
│   ├── 01-result.md
│   └── ...
└── evidence/
    ├── validation-report.md
    ├── smoke-tests.md
    ├── comparison.md
    └── ...
```

Não crie a pasta até existir uma migração real. Não gere logs gigantes nem
arquivos de estado transitório que não acrescentem evidência auditável.

## Contrato entre artefatos

- `migration-plan.md` registra a decisão da Etapa 4 e é o contrato autoritativo
  da migração formal.
- Cada `roadmap/<macrostep>.md` transforma o plano em uma unidade executável,
  ordenada e validável; a macroetapa ativa limita o Executor.
- Cada `execution/<n>-result.md` registra o que foi executado, desvios,
  comandos e critérios realmente verificados.
- `evidence/` contém resultados coletados, smoke tests e comparações da Etapa 6.
- `validation-report.md` consolida a revisão e declara o resultado final.

Decisões duráveis devem possuir identificadores como `DEC-001` e ser vinculadas
ao plano e às macroetapas. Se uma decisão alterar uma fronteira ou invariante,
avalie também `codelife-architecture-review` e a necessidade de ADR conforme as
regras do repositório.

Durante migração formal, não duplique `migration-plan.md` e a macroetapa em um
`codelife-change-contract`. Esse skill permanece para mudanças comuns fora do
workflow formal.

## Dois chats e fluxo de decisão

O chat de planejamento concentra contexto, decisão e revisão: `project-context`,
`migration-planner`, `migration-roadmap` e `validator`/`REVIEW`. O chat de
implementação recebe uma macroetapa por vez e concentra execução e coleta:
`migration-executor` e `validator`/`COLLECT`.

```text
DECISÃO → EXECUÇÃO → EVIDÊNCIA → REVISÃO
```

Uma decisão nova volta ao chat de planejamento, é registrada no plano/ADR
apropriado e só então libera a continuação do Executor.

## Gates

```text
G0 — contexto pronto
G1 — planejamento pronto
G2 — roadmap pronto
G3 — macroetapa pronta para execução
G4 — implementação da macroetapa concluída
G5 — evidências coletadas
G6 — validação final revisada
```

Um gate só pode ser marcado quando seu artefato e seus critérios tiverem sido
atendidos. Falhas, itens não executados e dependências de inspeção humana ficam
explícitos; não são convertidos em sucesso por inferência.
