# ADR 0004 — Contratos Zod e erros padronizados

**Contexto.** Web e API precisam concordar sobre sessão, conteúdo e falhas sem
exportar detalhes do Prisma.

**Decisão.** Centralizar schemas Zod e tipos em `contracts`, usá-los
também nas fronteiras de runtime e expor envelope estrito com status, código,
mensagem, request ID e detalhes seguros de validação. Erros conhecidos do Prisma
são mapeados; falhas inesperadas nunca devolvem stack ou mensagem interna.

**Alternativas.** DTOs manuais duplicados criariam deriva; modelos Prisma no
web exporiam persistência.

**Consequências.** Toda mudança pública deve atualizar schema, testes e
consumidores. O contrato já reserva tipos de slide, disponibilidade e conclusão
para TCC-15. Logs internos usam o mesmo request ID devolvido ao cliente.
