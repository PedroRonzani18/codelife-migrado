# ADR 0006 — Gates de qualidade e evidências

**Contexto.** A fundação deve ser auditável antes da jornada pedagógica.

**Decisão.** `check` cobre geração, lint, tipos, unitários e build sem Docker;
`verify` acrescenta migration/seed isolados, integração e E2E. A documentação
mantém roteiro humano de até cinco minutos.

**Alternativas.** Um único teste manual não verificaria contratos nem
integridade. Um gate com banco local não seria seguro.

**Consequências.** Falhas são reportadas como risco residual. Evidência de
reprodutibilidade não é evidência de sucesso metodológico universal.
