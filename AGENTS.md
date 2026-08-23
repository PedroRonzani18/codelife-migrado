# AGENTS.md — CodeLife migrado

## Missão e limites

Este repositório contém a implementação experimental controlada do CodeLife
para o TCC. Ele não representa a modernização integral do produto nem permite
alegar validação universal da metodologia acadêmica.

Antes de qualquer alteração não trivial, leia:

1. `.codex/context/current-contract.md`;
2. `.codex/context/decision-index.md`;
3. somente os ADRs e trechos do roadmap indicados pelo índice para a área
   afetada.

Não releia o roadmap integralmente por padrão: o índice existe para reduzir
contexto e preservar a decisão correta.

## Precedência e incerteza

Em caso de conflito, prevalecem: instrução explícita do usuário na conversa
atual, decisão mais recente em ADR ou roadmap, este arquivo, e por fim a
estrutura existente. Não invente requisitos, comportamento do legado,
evidência, resultados ou dados. Quando a decisão arquitetural não estiver
registrada, pare no planejamento e peça direção antes de implementá-la.

## Fluxo de trabalho

- Para feature, correção ou alteração funcional, use o skill local
  `codelife-change-contract` antes de editar.
- Para reorganização de módulos, abstrações, contratos, schema, migration ou
  mudança de fronteira, use primeiro `codelife-architecture-review`.
- Mantenha o diff mínimo e não misture limpeza estrutural com mudança de
  comportamento sem autorização explícita.
- Preserve alterações locais de outras pessoas; confira `git status` antes de
  agir e não descarte, mova ou reescreva trabalho alheio.

## Git e ações externas

Não criar branch, commit, push, Pull Request, merge, rebase, tag, publicação
ou mudança em Jira sem pedido explícito do usuário na conversa atual. Não
trabalhe diretamente em `main`; se a tarefa exigir uma branch e ela não tiver
sido indicada, peça direção.

## Estrutura e fronteiras

- `apps/api`: API Nest. Leia `apps/api/AGENTS.md` para alterações internas.
- `apps/api/prisma`: schema, migrations e seed. Leia o AGENTS aninhado antes
  de modificar persistência.
- `apps/web`: interface React. Leia `apps/web/AGENTS.md`.
- `packages/contracts`: única fronteira de shapes públicos entre API e web.
  Leia `packages/contracts/AGENTS.md`.
- `docs/adr`: decisões duráveis; `docs/roadmap-implementacao-tcc-15.md`:
  escopo, estado e critérios; `docs/evidence`: somente comportamento validado.

## Validação proporcional

- Documentação apenas: revisar links, consistência, `git diff --check`.
- Contrato compartilhado: `pnpm check` e validar os dois consumidores afetados.
- API sem schema: testes unitários/integrados da capacidade e `pnpm check`.
- Prisma, migration, seed ou progresso: `pnpm verify`.
- Web: `pnpm --filter web lint`, `typecheck`, `test` e `build`; executar
  E2E quando rota, autenticação, fluxo ou responsividade forem afetados.

Nunca reporte uma validação como concluída se ela falhar, não for executada ou
depender de inspeção humana. Registre o risco residual de forma objetiva.
