# Estado atual da fundação

O TCC-14 entrega uma base executável para a `island-3`, não a jornada vertical
com regras de progresso. A fixture contém exatamente uma ilha, três níveis e
nove slides de leitura controlados (`TextText`, `TextImage` e `TextCode`).

As fronteiras são:

```text
web: app -> modules -> features -> api/shared
api: controller -> service -> repository -> PrismaService
contracts: schemas Zod e tipos de API, sem modelos Prisma
```

O TCC-15 deverá adicionar rotas protegidas de navegação/conclusão e a regra de
disponibilidade sequencial. Não deve alterar a estrutura fundacional sem uma
decisão arquitetural adicional.
