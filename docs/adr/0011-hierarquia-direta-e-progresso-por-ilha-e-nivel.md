# ADR 0011 — Hierarquia direta e progresso por ilha e nível

**Status.** Aceito em 21 de agosto de 2026.

**Substitui.** ADR 0010 — Modelo composicional e progresso contextual.

## Contexto

O ADR 0010 separou conteúdo e posicionamento por meio de `TrailIsland`,
`IslandLevel` e `LevelSlide`. Durante a implementação da Macroetapa 2, esses
posicionamentos passaram a ser identidades públicas de rota e progresso. Isso
introduziu três camadas de indireção, uma raiz de progresso da trilha e
transações de navegação maiores do que o recorte experimental exige.

O TCC-15 possui uma ilha controlada, três níveis e nove slides. Não há CMS,
reutilização de conteúdo entre trilhas nem requisito atual de publicar o mesmo
nível em mais de uma ilha. Projetar essas capacidades antecipadamente tornou a
fatia mais difícil de compreender sem produzir evidência adicional para o TCC.

## Decisão

O conteúdo usa uma hierarquia direta:

```text
Island → Level → Slide
```

- `Level` contém `islandId` e `position`;
- `Slide` contém `levelId` e `position`;
- a posição é positiva e única dentro do pai;
- os UUIDs de `Island`, `Level` e `Slide` são as identidades de API;
- anterior e próximo são derivados da ordem, sem lista ligada persistida;
- os subtipos `TextText`, `TextImage` e `TextCode` e os ativos locais
  controlados permanecem inalterados.

O progresso possui somente as raízes necessárias:

```text
UserIslandProgress → UserLevelProgress
```

`UserIslandProgress` é único por pessoa e ilha, registra `currentLevelId` e
`startedAt`. `UserLevelProgress` é único por progresso de ilha e nível, registra
`currentSlideId`, `startedAt` e `completedAt` opcional.

Iniciar, navegar e concluir são comandos, não um CRUD público de progresso:

```text
POST /progress/levels/:levelId/start
PUT  /progress/levels/:levelId/current-slide
POST /progress/levels/:levelId/complete
```

O início é explícito e idempotente, sempre no primeiro slide. Navegar exige um
nível iniciado e aceita somente o slide atual ou adjacente enquanto o nível
está em andamento. Após a conclusão, qualquer slide do mesmo nível pode ser
revisto. A conclusão é explícita, idempotente, preserva o primeiro
`completedAt` e só é aceita quando o cursor está no último slide.

As operações de conteúdo continuam internas ao seed e aos repositories. CRUD
HTTP administrativo para ilha, nível e slide permanece fora do escopo porque
não há CMS nem papel de administração no recorte.

## Migração e integridade

A migration converte os posicionamentos existentes em relações diretas somente
quando cada nível e slide possui exatamente um pai. Se houver reutilização ou
progresso composicional, ela falha antes de descartar qualquer estrutura, pois
não existe regra segura para adivinhar o contexto pretendido.

As FKs continuam com `RESTRICT`. O seed é idempotente e não altera progresso.

## Consequências

Rotas, contratos, repositories e testes passam a usar IDs das entidades. A
leitura e o snapshot exigem menos joins, e cada comando de progresso altera no
máximo os cursores de ilha e nível necessários.

O desenho não permite reutilizar o mesmo registro de nível em ilhas diferentes
ou o mesmo registro de slide em níveis diferentes. Se essa necessidade surgir,
ela deverá ser demonstrada e introduzida por uma decisão separada, sem fazer
parte implícita do TCC-15.

A persistência do cursor por slide continua sendo uma adaptação deliberada do
recorte experimental, não uma alegação de equivalência estrita com o legado.
