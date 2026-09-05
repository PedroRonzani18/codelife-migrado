# ADR 0010 — Modelo composicional e progresso contextual

**Status.** Substituído pelo [ADR 0011 — Hierarquia direta e progresso por ilha e nível](0011-hierarquia-direta-e-progresso-por-ilha-e-nivel.md), em 21 de agosto de 2026.

**Substitui.** ADR 0003 — Modelo de dados direto da fundação.

## Contexto

A fundação do TCC-14 materializou a hierarquia direta `Island → Level → Slide`
e um `UserProgress` associado somente à conclusão de nível. Esse desenho era
suficiente para demonstrar a leitura inicial, mas não representa a jornada
autenticada definida para o TCC-15: o mesmo conteúdo pode ser usado em mais de
uma composição e a pessoa deve retomar exatamente o slide em que estava.

O cursor por slide é uma **adaptação deliberada do recorte experimental**. Ele
não é apresentado como comportamento estritamente equivalente ao legado, que
permanece como linha de base para comparação. A adaptação preserva a conclusão
explícita por nível e torna observável a continuidade de navegação necessária à
fatia, sem ampliar o experimento para CMS, histórico pedagógico ou produto
completo.

## Decisão

### Composição e identidade

O produto possui uma única trilha na interface, mas a trilha é uma entidade
explícita. A composição passa a separar conteúdo atômico de sua localização:

```text
Trail → TrailIsland → Island → IslandLevel → Level → LevelSlide → Slide
```

- `Trail`, `Island`, `Level` e `Slide` são entidades atômicas reutilizáveis;
- `TrailIsland`, `IslandLevel` e `LevelSlide` são posicionamentos com UUID
  próprio e `position` positiva;
- a ordem é derivada de `position`, sem `nextSlideId` ou `previousSlideId`
  persistidos;
- cada composição exige unicidade de posição por pai;
- rotas, progresso e autorização usam os UUIDs dos posicionamentos, e não
  slugs decorativos ou IDs de conteúdo atômico;
- `Slide` usa subtipos relacionais coerentes com o discriminante (`TextText`,
  `TextImage` e `TextCode`). Imagens referenciam ativos locais controlados;
  não há URL externa arbitrária nem execução de código.

O conteúdo pode ser reutilizado, inclusive na mesma composição. Portanto,
progresso não pode ser associado apenas a `Level` ou `Slide` atômicos.

### Progresso e conclusão

O progresso é contextual e hierárquico:

```text
UserTrailProgress → UserIslandProgress → UserLevelProgress
```

Cada raiz é única por pessoa e trilha; seus descendentes são únicos dentro do
posicionamento correspondente. Os cursores persistidos apontam para
`TrailIsland`, `IslandLevel` e `LevelSlide`. Em `UserLevelProgress`,
`currentLevelSlideId` registra somente a localização atual e `completedAt` é
opcional.

A conclusão continua sendo explícita, idempotente e terminal **por nível
posicionado**. Chegar ao último slide não conclui automaticamente o nível.
Níveis concluídos podem ser revisados sem alterar `completedAt`; navegar em um
nível em andamento atualiza apenas o cursor atual. A disponibilidade é derivada
no servidor como `available`, `in_progress`, `blocked` ou `completed`, com
liberação sequencial por `IslandLevel`.

`lastVisited` é derivado dos cursores persistidos. `nextRecommended` é uma
recomendação derivada do primeiro nível iniciado ou disponível ainda não
concluído; os dois conceitos não devem ser confundidos.

### Limites intencionais

Não serão persistidos percentual, estado textual redundante, maior posição
alcançada, `furthestLevelSlideId`, histórico de visitas, conclusão de ilha ou
trilha, `revision` ou `expectedRevision`. Em concorrência, os comandos ocorrem
em transação, a raiz de progresso é protegida e a última navegação confirmada
define o cursor; não há protocolo especial para múltiplas abas.

Editar o conteúdo de um `Slide`, ou reordenar/adicionar/remover
posicionamentos, não invalida nem rebaixa progresso automaticamente. Quando
uma alteração exigir nova conclusão, ela deve introduzir uma nova composição,
nível ou trilha. Essa política não autoriza criar CMS, edição administrativa ou
versionamento formal de conteúdo no TCC-15.

A migration não migra nem apaga `UserProgress` histórico: ela só pode prosseguir
se a tabela antiga estiver vazia e deve falhar explicitamente em caso contrário.
FKs de conteúdo e progresso usam `RESTRICT`, evitando perdas silenciosas.

## Alternativas consideradas

- **Manter a hierarquia física direta:** simplificaria a fixture, mas impediria
  reutilização contextual e deixaria cursor/progresso acoplados ao conteúdo.
- **Persistir uma lista ligada de slides:** armazenaria vínculos redundantes;
  a ordenação por posição já permite derivar anterior e próximo de forma
  determinística.
- **Associar progresso ao `Level` atômico:** faria uma conclusão vazar entre
  ilhas ou trilhas que reutilizassem o mesmo nível.
- **Usar maior avanço, histórico ou revisão otimista:** ampliaria o contrato e
  a superfície de concorrência sem necessidade para a fatia experimental.
- **Invalidar progresso após edição:** rebaixaria conclusões automaticamente e
  exigiria uma política de versionamento fora do escopo.

## Consequências

Schema, migration, seed, contratos e testes do TCC-15 devem adotar essas
identidades e invariantes. O seed precisa ser idempotente e não destrutivo em
relação ao progresso já existente. As APIs futuras devem devolver um snapshot
canônico da trilha e validar transições de cursor no servidor.

A comparação acadêmica deve tratar a persistência por slide e a navegação
contextual como adaptação aprovada, registrando-a na rastreabilidade e na
avaliação posterior. Não se deve alegar equivalência estrita com o legado para
esse comportamento, nem generalizar a intervenção para o CodeLife inteiro.
