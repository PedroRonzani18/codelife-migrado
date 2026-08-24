# ADR 0005 — Seed idempotente e banco isolado

**Contexto.** O experimento precisa de dados repetíveis sem tocar no banco
local persistente nem no legado.

**Decisão.** Executar os `upsert` da fixture em transação e usar Compose
temporário com banco `codelife_test`, criado e removido exclusivamente por
`pnpm verify`. Configuração explícita sempre prevalece sobre `.env`; o validator
não lê filesystem nem `process.env`. O verify valida host e nome do banco, usa
portas dinâmicas e executa o seed duas vezes.

**Alternativas.** Reutilizar o banco local poderia destruir dados do usuário;
seed não idempotente duplicaria a evidência.

**Consequências.** Verificação completa exige Docker. O script testa chaves,
ordem, tipos, FKs, integridade 1 × 3 × 9 e que uma segunda execução do seed
preserva progresso criado posteriormente. O seed não lê, exige ausência, altera
nem apaga progresso. Conteúdo adicional não é apagado silenciosamente;
divergência provoca rollback. FKs de conteúdo e progresso usam `RESTRICT` para
evitar perda cascata acidental.
