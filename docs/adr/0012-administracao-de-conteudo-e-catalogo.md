# ADR 0012 — Administração de conteúdo, catálogo e persistência

**Status.** Aceito em 21 de setembro de 2026.

**Vínculo com planejamento.** TCC-19 / TCC-32 / TCC-33 / TCC-34.

## Contexto

A migração inicial do TCC-15 estabeleceu a jornada autenticada e o progresso em uma hierarquia direta fixa (`island-3`, três níveis e nove slides). No entanto, a aplicação não oferecia capacidade administrativa para que usuários com papel `ADMIN` criassem, editassem, reordenassem, publicassem ou excluíssem conteúdo. O conteúdo dependia exclusivamente da fixture de seed, e a leitura de estudantes assumia `island-3` como destino padrão, sem catálogo de ilhas nem restrição a conteúdo publicado.

O TCC-32 planeja a intervenção experimental de administração de conteúdo para o MVP acadêmico, delimitando o domínio em `Island → Level → Slide`, três tipos de slide (`TextText`, `TextImage`, `TextCode`), ordenação com proteção de progresso e catálogo público sequencial.

## Decisões

### DEC-TCC32-001: Estado editorial por `publishedAt`
`Island` e `Level` possuem campo `publishedAt DateTime?`. O valor `null` indica rascunho (`DRAFT`), e qualquer data válida indica publicado (`PUBLISHED`). `Slide` não possui estado editorial próprio; ele herda o estado do seu `Level` pai. Estudantes só visualizam e acessam ilhas e níveis publicados.

### DEC-TCC32-002: Prefixo protegido consciente do progresso (Progress-Aware Protected Prefix)
A estrutura percorrida por qualquer estudante fica protegida contra alterações destrutivas:
- O prefixo de ilhas até a ilha mais avançada por qualquer usuário não pode ser reordenado nem receber inserção interna.
- Havendo progresso em uma ilha posterior, todas as ilhas anteriores têm sua estrutura integralmente protegida.
- Dentro de uma ilha, o prefixo de níveis com progresso fica protegido contra reordenação e inserções.
- Se um nível possuir qualquer progresso registrado, a estrutura de seus slides fica congelada.
- Despublicar ou excluir entidades com progresso é proibido (`CONTENT_HAS_PROGRESS`).
- Exclusões de agregados são atômicas na aplicação; as chaves estrangeiras no banco preservam `RESTRICT`.

### DEC-TCC32-003: Banco migrado como fonte única e seed all-or-nothing
Após a migração, o banco de dados é a única fonte da verdade. O seed torna-se uma operação de bootstrap:
- Se existir **qualquer** `Island` persistida, o seed de conteúdo e de mídias controladas é ignorado integralmente (*all-or-nothing*), registrando a ação em log.
- O seed de usuários e dados não relacionados a conteúdo continua independente e idempotente.
- A fixture histórica nunca sobrescreve alterações realizadas por administradores.

### DEC-TCC32-004: Administração modular nos limites de capacidade
A administração não é um monólito separado de domínio. As operações residem nos módulos de capacidade existentes (`learning/islands`, `learning/levels`, `learning/slides`, `learning/media`), com controllers e serviços administrativos isolados sob o prefixo `/admin/content` e protegidos por `@Roles('ADMIN')`. Operações atômicas entre entidades utilizam um runner transacional explícito.

### DEC-TCC32-005: Mídia local gravável atrás de port com normalização WebP
O port `IObjectStorage` suporta leitura, escrita e remoção compensatória. O upload administrativo é limitado a um arquivo de até 5 MB nos formatos PNG, JPEG ou WebP, inspecionado por biblioteca real (`sharp`), sem aceitar SVG de administradores. O arquivo é normalizado para WebP, redimensionado para os limites permitidos (até 4096 × 4096), e salvo com nome UUID desacoplado do arquivo original.

### DEC-TCC32-006: Catálogo sequencial derivado do progresso existente
O endpoint público `GET /learning/islands` expõe a lista sequencial de ilhas publicadas com disponibilidade (`available`, `in_progress`, `blocked`, `completed`). A disponibilidade é derivada dinamicamente pelo `ProgressService` a partir dos níveis publicados concluídos na ilha anterior. Acesso direto a ilhas bloqueadas retorna `403` com erro estável `ISLAND_BLOCKED`.

### DEC-TCC32-007: Concorrência otimista mínima por `updatedAt`
Detalhes administrativos retornam `updatedAt`. Requisições mutáveis enviam `expectedUpdatedAt`. Divergências indicam edição concorrente e são rejeitadas imediatamente com `409` e código `CONTENT_STALE`. A interface recarrega os dados atualizados sem mesclagem automática.

---

## Matriz de Contratos HTTP e OpenAPI

Os corpos de requisição e resposta são canônicos em `@codelife/contracts/content-management`. A documentação OpenAPI reflete a seguinte especificação:

| Método e Rota | Autenticação e Papel | Corpo da Requisição | Resposta de Sucesso | Erros de Domínio Mapeados |
| --- | --- | --- | --- | --- |
| `GET /admin/content/tree` | Cookie + `ADMIN` | — | `200` `AdminContentTree` | `UNAUTHORIZED`, `FORBIDDEN` |
| `POST /admin/content/islands` | Cookie + `ADMIN` + `Origin` | `CreateIslandInput` | `201` `AdminIslandDetail` | `VALIDATION_ERROR`, `UNIQUE_CONFLICT` |
| `GET /admin/content/islands/:islandId` | Cookie + `ADMIN` | — | `200` `AdminIslandDetail` | `RESOURCE_NOT_FOUND` |
| `PATCH /admin/content/islands/:islandId` | Cookie + `ADMIN` + `Origin` | `UpdateIslandInput` | `200` `AdminIslandDetail` | `CONTENT_STALE`, `UNIQUE_CONFLICT`, `RESOURCE_NOT_FOUND` |
| `DELETE /admin/content/islands/:islandId` | Cookie + `ADMIN` + `Origin` | — | `204` No Content | `CONTENT_NOT_DRAFT`, `CONTENT_HAS_PROGRESS`, `RESOURCE_NOT_FOUND` |
| `POST /admin/content/islands/:islandId/publish` | Cookie + `ADMIN` + `Origin` | `PublishContentInput` | `200` `AdminIslandDetail` | `CONTENT_STALE`, `CONTENT_NOT_PUBLISHABLE`, `RESOURCE_NOT_FOUND` |
| `POST /admin/content/islands/:islandId/unpublish` | Cookie + `ADMIN` + `Origin` | `UnpublishContentInput` | `200` `AdminIslandDetail` | `CONTENT_STALE`, `CONTENT_HAS_PROGRESS`, `RESOURCE_NOT_FOUND` |
| `PUT /admin/content/islands/order` | Cookie + `ADMIN` + `Origin` | `ReorderIslandsInput` | `200` `AdminIslandTreeItem[]` | `CONTENT_ORDER_CONFLICT`, `VALIDATION_ERROR` |
| `POST /admin/content/islands/:islandId/levels` | Cookie + `ADMIN` + `Origin` | `CreateLevelInput` | `201` `AdminLevelDetail` | `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND` |
| `GET /admin/content/levels/:levelId` | Cookie + `ADMIN` | — | `200` `AdminLevelDetail` | `RESOURCE_NOT_FOUND` |
| `PATCH /admin/content/levels/:levelId` | Cookie + `ADMIN` + `Origin` | `UpdateLevelInput` | `200` `AdminLevelDetail` | `CONTENT_STALE`, `RESOURCE_NOT_FOUND` |
| `DELETE /admin/content/levels/:levelId` | Cookie + `ADMIN` + `Origin` | — | `204` No Content | `CONTENT_NOT_DRAFT`, `CONTENT_HAS_PROGRESS`, `RESOURCE_NOT_FOUND` |
| `POST /admin/content/levels/:levelId/publish` | Cookie + `ADMIN` + `Origin` | `PublishContentInput` | `200` `AdminLevelDetail` | `CONTENT_STALE`, `CONTENT_NOT_PUBLISHABLE`, `RESOURCE_NOT_FOUND` |
| `POST /admin/content/levels/:levelId/unpublish` | Cookie + `ADMIN` + `Origin` | `UnpublishContentInput` | `200` `AdminLevelDetail` | `CONTENT_STALE`, `CONTENT_HAS_PROGRESS`, `RESOURCE_NOT_FOUND` |
| `PUT /admin/content/islands/:islandId/levels/order` | Cookie + `ADMIN` + `Origin` | `ReorderLevelsInput` | `200` `AdminLevelTreeItem[]` | `CONTENT_ORDER_CONFLICT`, `VALIDATION_ERROR` |
| `POST /admin/content/levels/:levelId/slides` | Cookie + `ADMIN` + `Origin` | `CreateSlideInput` | `201` `AdminSlideDetail` | `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND` |
| `GET /admin/content/slides/:slideId` | Cookie + `ADMIN` | — | `200` `AdminSlideDetail` | `RESOURCE_NOT_FOUND` |
| `PATCH /admin/content/slides/:slideId` | Cookie + `ADMIN` + `Origin` | `UpdateSlideInput` | `200` `AdminSlideDetail` | `CONTENT_STALE`, `RESOURCE_NOT_FOUND` |
| `DELETE /admin/content/slides/:slideId` | Cookie + `ADMIN` + `Origin` | — | `204` No Content | `CONTENT_NOT_DRAFT`, `RESOURCE_NOT_FOUND` |
| `PUT /admin/content/levels/:levelId/slides/order` | Cookie + `ADMIN` + `Origin` | `ReorderSlidesInput` | `200` `AdminSlideTreeItem[]` | `CONTENT_ORDER_CONFLICT`, `VALIDATION_ERROR` |
| `POST /admin/content/media` | Cookie + `ADMIN` + `Origin` | `multipart/form-data` | `201` `MediaAssetSummary` | `VALIDATION_ERROR`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE` |
| `GET /learning/islands` | Cookie (`USER`/`ADMIN`) | — | `200` `IslandCatalogItem[]` | `UNAUTHORIZED` |

---

## Consequências

- O modelo de dados adiciona `Island.position` única e positiva, além de `Island.publishedAt` e `Level.publishedAt`.
- `Island.slug` torna-se imutável após a primeira publicação.
- A persistência continua protegida por chaves estrangeiras `RESTRICT` e transações explícitas.
- Nenhuma dependência com `island-3` permanece fora da fixture inicial de demonstração.
