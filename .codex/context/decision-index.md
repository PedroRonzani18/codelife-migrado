# Índice de decisões — CodeLife migrado

Use este índice para carregar somente o contexto necessário à mudança.

| Se a mudança envolve | Regra a preservar | Ler antes de editar |
| --- | --- | --- |
| Escopo, status ou evidência do TCC-15 | A fatia é `island-3`; não afirmar migração integral ou validação universal. | `docs/roadmap-implementacao-tcc-15.md` §§1–2, 7–9; `docs/evidence/tcc-15-validation.md` |
| Hierarquia, IDs, progresso ou comandos | Hierarquia direta e progresso por ilha/nível; comandos idempotentes; prefixo protegido. | ADRs 0011 e 0012 (DEC-TCC32-001..002); roadmap §3 |
| Administração de conteúdo ou catálogo | Rascunhos restritos a ADMIN, catálogo sequencial de publicadas, concorrência por updatedAt. | ADR 0012 (DEC-TCC32-001..007); migration plan TCC-32 |
| API Nest e organização de módulos | Fronteiras de negócio no topo; capacidade antes de camada global; admin por módulo. | ADRs 0008 e 0012 (DEC-TCC32-004) |
| Repositories, DI ou testes de persistência | Service depende de port tipado; Prisma não atravessa a fronteira; transaction runner. | ADRs 0009 e 0012 |
| Contratos HTTP, schemas ou erros | Zod é a API pública; detalhes Prisma não são compartilhados; erros de domínio padronizados. | ADRs 0001, 0004 e 0012 |
| Schema, migration, seed ou banco | Alterações devem falhar com segurança; seed all-or-nothing para conteúdo; posições determinísticas. | ADRs 0005, 0011 e 0012 (DEC-TCC32-003) |
| Testes, CI ou evidências | `check`, cobertura e `verify` são gates; evidência relata somente execução real. | ADR 0006; `docs/guides/commands.md` |
| Interface, componentes ou fluxo da jornada | Organização por domínio; reuso antes de `shared`; UX de início e conclusão vigente. | `current-contract.md`; roadmap §6 |

Se a mudança afetar mais de uma linha, leia todas as fontes correspondentes e
explicite o impacto no plano antes de editar.
