# ADR 0001 — Monorepo pnpm com Turbo

**Contexto.** A fatia envolve web, API e contratos que precisam evoluir em
conjunto, mas sem acoplamento direto entre aplicações.

**Decisão.** Usar `apps/web`, `apps/api` e `packages/contracts`, com pnpm 11,
Node 24 e Turbo. Os contratos compartilham apenas shapes públicos Zod.

**Alternativas.** Dois repositórios independentes aumentariam a duplicação; um
único app fullstack reduziria a separação observável.

**Consequências.** Há um lockfile e gates únicos; mudanças de contrato exigem
validação nos dois consumidores. A fronteira atende a decisão de fatia vertical
do TCC-11 sem pressupor modernização do produto inteiro.
