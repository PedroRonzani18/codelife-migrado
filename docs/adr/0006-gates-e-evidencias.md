# ADR 0006 — Gates de qualidade e evidências

**Contexto.** A fundação deve ser auditável antes da jornada pedagógica.

**Decisão.** `check` cobre geração, lint, tipos, unitários e build sem Docker;
`test:api:cov` exige 80% em branches, funções, linhas e statements; `verify`
acrescenta migration/seed isolados, integração e E2E. GitHub Actions executa
qualidade, auditoria de dependências, secret scan e CodeQL. A documentação
mantém roteiro humano de até cinco minutos.

**Alternativas.** Um único teste manual não verificaria contratos nem
integridade. Um gate com banco local não seria seguro.

**Consequências.** Falhas bloqueiam o gate e são reportadas como risco residual.
Arquivos de bootstrap e módulos declarativos não entram na cobertura; services,
guards, repositories, filtros, config e health entram. Evidência de
reprodutibilidade não é evidência de sucesso metodológico universal.
