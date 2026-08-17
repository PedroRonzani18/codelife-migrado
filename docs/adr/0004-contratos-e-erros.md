# ADR 0004 — Contratos Zod e erros padronizados

**Contexto.** Web e API precisam concordar sobre sessão, conteúdo e falhas sem
exportar detalhes do Prisma.

**Decisão.** Centralizar schemas Zod e tipos em `@codelife/contracts`; expor
um envelope de erro com status, código e mensagem.

**Alternativas.** DTOs manuais duplicados criariam deriva; modelos Prisma no
web exporiam persistência.

**Consequências.** Toda mudança pública deve atualizar o schema e consumidores.
O contrato já reserva tipos de slide, disponibilidade e conclusão para TCC-15.
