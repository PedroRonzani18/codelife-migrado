# Índice de decisões — CodeLife migrado

Use este índice para carregar somente o contexto necessário à mudança.

| Se a mudança envolve | Regra a preservar | Ler antes de editar |
| --- | --- | --- |
| Escopo, status ou evidência do TCC-15 | A fatia é `island-3`; não afirmar migração integral ou validação universal. | `docs/roadmap-implementacao-tcc-15.md` §§1–2, 7–9; `docs/evidence/tcc-15-validation.md` |
| Hierarquia, IDs, progresso ou comandos | Hierarquia direta e progresso por ilha/nível; comandos idempotentes. | ADR 0011; roadmap §3 |
| API Nest e organização de módulos | Fronteiras de negócio no topo; capacidade antes de camada global. | ADR 0008 |
| Repositories, DI ou testes de persistência | Service depende de port tipado; Prisma não atravessa a fronteira. | ADR 0009 |
| Contratos HTTP, schemas ou erros | Zod é a API pública; detalhes Prisma não são compartilhados. | ADRs 0001 e 0004 |
| Schema, migration, seed ou banco | Alterações devem falhar com segurança e nunca apagar/alterar progresso implicitamente. | ADR 0005; ADR 0011 |
| Testes, CI ou evidências | `check`, cobertura e `verify` são gates; evidência relata somente execução real. | ADR 0006; `docs/guides/commands.md` |
| Interface, componentes ou fluxo da jornada | Organização por domínio; reuso antes de `shared`; UX de início e conclusão vigente. | `current-contract.md`; roadmap §6 |

Se a mudança afetar mais de uma linha, leia todas as fontes correspondentes e
explicite o impacto no plano antes de editar.
