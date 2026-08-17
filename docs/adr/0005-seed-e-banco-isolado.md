# ADR 0005 — Seed idempotente e banco isolado

**Contexto.** O experimento precisa de dados repetíveis sem tocar no banco
local persistente nem no legado.

**Decisão.** Usar `upsert` para a fixture e um Compose temporário, com banco
`codelife_test`, criado e removido exclusivamente por `pnpm verify`.

**Alternativas.** Reutilizar o banco local poderia destruir dados do usuário;
seed não idempotente duplicaria a evidência.

**Consequências.** Verificação completa exige Docker. O script testa a
integridade 1 × 3 × 9 após o seed.
