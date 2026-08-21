# ADR 0003 — Modelo de dados direto da fundação (substituído)

**Status.** Substituído pelo [ADR 0010 — Modelo composicional e progresso
contextual](0010-modelo-composicional-e-progresso-contextual.md), em 20 de
agosto de 2026.

**Contexto histórico.** A fundação do TCC-14 partia da linha de base direta
`Island → Level → Slide` e representava somente a conclusão por nível.

**Decisão histórica.** A fundação modelou `User`, `Island`, `Level`, `Slide` e
`UserProgress` com chaves estáveis, integridade referencial e unicidade de
ordenação/progresso. A ausência de registro de progresso significava nível não
concluído, e `skipped` não integrava o recorte.

**Motivo da substituição.** Esse modelo não representa o contrato consolidado
para o TCC-15: ele não distingue conteúdo de posicionamento, não possui trilha
explícita e não consegue registrar o cursor atual sem fazer o progresso vazar
entre composições. Sua referência a cascatas também não é compatível com a
política atual de FKs `RESTRICT` para conteúdo e progresso.

**Consequência.** Este ADR permanece como evidência da decisão da fundação,
mas não deve orientar schema, migration, seed, contratos ou comportamento da
jornada do TCC-15. As decisões vigentes estão no ADR 0010 e no
[`roadmap-implementacao-tcc-15.md`](../roadmap-implementacao-tcc-15.md).
