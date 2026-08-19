# Estado atual da fundação

O TCC-14 entrega uma base executável para a `island-3`, não a jornada vertical
com regras de progresso. A fixture contém exatamente uma ilha, três níveis e
nove slides de leitura controlados (`TextText`, `TextImage` e `TextCode`).

As fronteiras são:

```text
web: app -> modules -> features -> api/shared
api: modules -> features -> controller -> service -> repository port -> Prisma repository -> PrismaService
contracts: schemas Zod e tipos de API, sem modelos Prisma
```

Na API, módulos pequenos podem manter seus artefatos no mesmo nível. Módulos
com mais de uma capacidade são organizados primeiro por funcionalidade. A
leitura da ilha está em `learning/islands`; o progresso previsto para o TCC-15
deve ocupar `learning/progress`. Artefatos transversais ficam separados entre
HTTP e observabilidade, conforme o ADR 0008.

Services dependem de ports de persistência associados a tokens de injeção, não
das implementações concretas. Implementações Prisma e seus testes de integração
seguem o ADR 0009; interfaces não são criadas apenas para espelhar controllers
ou services com uma única implementação.

O TCC-15 deverá adicionar rotas protegidas de navegação/conclusão e a regra de
disponibilidade sequencial dentro dessas fronteiras. Mudanças adicionais na
estrutura fundacional exigem nova decisão arquitetural.
