# ADR 0007 — Observabilidade e saúde operacional

**Contexto.** Um health check constante e logs sem correlação não distinguem
processo vivo, banco disponível e falhas pertencentes à mesma requisição.

**Decisão.** Gerar ou validar `x-request-id`, devolvê-lo em toda resposta e
usá-lo nos logs HTTP e de erro. Manter `/health/live` para liveness e usar
`/health/ready` com consulta ao PostgreSQL para readiness. Bootstrap, testes de
integração, Helmet, CORS, pipes e filtros são configurados pela mesma função.
Swagger fica desligado por padrão fora de desenvolvimento.

**Alternativas.** CloudWatch, OpenTelemetry e plataformas externas ampliariam
o escopo do experimento. Um único `/health` constante não observaria o banco.

**Consequências.** O backend permanece independente de fornecedor, oferece
correlação mínima e encerra o Prisma em sinais de shutdown. `/health` permanece
como alias de liveness por compatibilidade local.
