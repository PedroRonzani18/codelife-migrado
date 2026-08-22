# Estado atual da fundação e fronteiras do TCC-15

O TCC-15 trabalha com uma fixture controlada: a `island-3`, três níveis e nove
slides de leitura dos tipos `TextText`, `TextImage` e `TextCode`. A estrutura
vigente é direta:

```text
Island → Level → Slide
```

Cada entidade possui UUID próprio. `Level.position` ordena níveis dentro da
ilha e `Slide.position` ordena slides dentro do nível. Anterior e próximo são
derivados dessa ordem. Não existem `Trail`, tabelas de posicionamento ou IDs
intermediários na API. O [ADR 0011](../adr/0011-hierarquia-direta-e-progresso-por-ilha-e-nivel.md)
é a decisão normativa atual e substitui o desenho composicional do ADR 0010.

As fronteiras de código são:

```text
web: app -> modules -> features -> api/shared
api: controller -> service -> repository port -> Prisma repository -> PrismaService
contracts: schemas Zod e tipos públicos, sem modelos Prisma
```

Na API, cada capacidade fica em sua pasta (`learning/islands`,
`learning/levels`, `learning/progress`), com repositories segregados quando há
mais de um artefato de persistência.

O progresso vigente é:

```text
UserIslandProgress → UserLevelProgress
```

Iniciar um nível cria, de forma idempotente, o progresso da ilha e do nível no
primeiro slide. Navegar atualiza o cursor do slide e concluir grava
`completedAt` somente no último slide. A disponibilidade é derivada no servidor
como `available`, `in_progress`, `blocked` ou `completed`; o nível seguinte é
liberado após a conclusão do predecessor. `GET` nunca cria progresso.

Os comandos públicos são:

```text
POST /progress/levels/:levelId/start
PUT  /progress/levels/:levelId/current-slide
POST /progress/levels/:levelId/complete
```

Não fazem parte da fatia: CRUD HTTP administrativo, CMS, trilhas reutilizáveis,
upload, percentual persistido, histórico de visitas, conclusão de ilha, reset
por API, versionamento formal de conteúdo ou sincronização especial entre abas.

A persistência por slide é uma adaptação deliberada do recorte, não uma
alegação de equivalência estrita com o legado. O seed é idempotente, usa ativos
locais controlados e não altera progresso existente.
