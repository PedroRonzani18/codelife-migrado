# ADR 0003 — Modelo de dados da fatia

**Contexto.** A linha de base fixa Ilha → Nível → Slide e progresso por nível.

**Decisão.** Modelar `User`, `Island`, `Level`, `Slide` e `UserProgress` com
chaves estáveis, FKs, cascatas e unicidade de ordenação/progresso. Ausência de
registro de progresso significa não concluído; `skipped` não existe.

**Alternativas.** Copiar o esquema legado preservaria ambiguidades; salvar IDs
livres não forneceria integridade.

**Consequências.** A migration é versionada e a fixture pode ser recriada. A
regra de liberação sequencial permanece para o TCC-15, conforme TCC-11.
