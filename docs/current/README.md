# Estado atual da fundação e fronteiras do TCC-15

O TCC-14 entregou uma base executável para a `island-3`, não a jornada vertical
com regras de progresso. Para o TCC-15, a Macroetapa 1 consolida o contrato que
substitui o modelo direto da fundação; a jornada só pode ser considerada
implementada quando as etapas posteriores entregarem e validarem seu
comportamento.

A fixture experimental continua delimitada a uma única trilha, a `island-3`,
três níveis e nove posicionamentos de slides de leitura controlados
(`TextText`, `TextImage` e `TextCode`). A trilha é singleton na interface, mas
é uma entidade explícita no banco. A composição separa conteúdo e localização:

```text
Trail → TrailIsland → Island → IslandLevel → Level → LevelSlide → Slide
```

`TrailIsland`, `IslandLevel` e `LevelSlide` têm UUID e posição próprios. A
sequência é derivada por `position`; conteúdo atômico e slugs decorativos não
são usados como identidade de rota, autorização ou progresso. O detalhamento
normativo está no [ADR 0010](../adr/0010-modelo-composicional-e-progresso-contextual.md),
que substitui o ADR 0003 para o TCC-15.

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

O progresso do TCC-15 é contextual à composição:

```text
UserTrailProgress → UserIslandProgress → UserLevelProgress
```

Ele preserva a conclusão explícita por nível posicionado e acrescenta o cursor
do `LevelSlide` atual. A disponibilidade é derivada no servidor como
`available`, `in_progress`, `blocked` ou `completed`; níveis seguintes só são
liberados após a conclusão do predecessor. `lastVisited` vem dos cursores e
`nextRecommended` é calculado separadamente.

Não fazem parte da fatia: percentual persistido, maior avanço, histórico de
visitas, revisão de concorrência, sincronização especial entre abas, conclusão
de ilha/trilha, reset por API, CMS, upload, versionamento formal de conteúdo ou
invalidação automática de progresso. Editar conteúdo ou mudar posições não
rebaixa conclusões; uma nova exigência de conclusão requer uma nova composição,
nível ou trilha.

A persistência por slide é uma adaptação deliberada do recorte, não uma alegação
de equivalência estrita com o legado. O legado permanece como linha de base e a
adaptação deve ser registrada na rastreabilidade e avaliação acadêmica.

O TCC-15 adicionará, dentro dessas fronteiras, rotas protegidas de leitura,
navegação e conclusão, com validação no servidor e snapshot canônico retornado
em mutações. Mudanças adicionais na estrutura fundacional exigem nova decisão
arquitetural.
