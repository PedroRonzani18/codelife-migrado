# ADR 0003 — Modelo de dados direto da fundação (substituído)

**Status.** Substituído. O sucessor vigente é o [ADR 0011 — Hierarquia direta e
progresso por ilha e nível](0011-hierarquia-direta-e-progresso-por-ilha-e-nivel.md),
aceito em 21 de agosto de 2026.

**Contexto histórico.** A fundação do TCC-14 partia da linha de base direta
`Island → Level → Slide` e representava somente a conclusão por nível.

**Decisão histórica.** A fundação modelou `User`, `Island`, `Level`, `Slide` e
`UserProgress` com chaves estáveis, integridade referencial e unicidade de
ordenação/progresso. A ausência de registro de progresso significava nível não
concluído, e `skipped` não integrava o recorte.

**Motivo da substituição.** Embora a hierarquia direta tenha sido retomada pelo
ADR 0011, a fundação não possuía início explícito, cursor do slide atual nem a
separação `UserIslandProgress → UserLevelProgress`. Sua referência a cascatas
também não é compatível com a política atual de FKs `RESTRICT`.

**Consequência.** Este ADR permanece como evidência da decisão da fundação,
mas não deve orientar schema, migration, seed, contratos ou comportamento da
jornada do TCC-15. As decisões vigentes estão no ADR 0011 e no
[`roadmap-implementacao-tcc-15.md`](../roadmap-implementacao-tcc-15.md).
