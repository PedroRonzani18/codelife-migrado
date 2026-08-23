# Validação e evidências de implementação — TCC-15

**Execução de referência:** 23 de agosto de 2026, em ambiente local limpo.

Esta evidência confirma a implementação delimitada da jornada `island-3`. Ela
não representa validação universal da modernização nem migração integral do
CodeLife legado.

## Matriz de rastreabilidade

| Requisito | Implementação | Teste automatizado | Evidência executada |
| --- | --- | --- | --- |
| Fixture controlada `1 × 3 × 9`, seed idempotente e banco isolado | migrations Prisma, `apps/api/prisma/seed.ts` e `scripts/verify.mjs` | `apps/api/test/fixture.integration-spec.ts` | `pnpm verify` aplica migrations em PostgreSQL efêmero e executa o seed duas vezes. |
| Upgrade protegido desde TCC-14 | migrations `20260820000000_*` e `20260821000000_*` | `validateTcc15UpgradeScenarios` em `scripts/verify.mjs` | o gate aprova a conversão sem progresso e rejeita progresso legado ou composicional ambíguo sem alterá-lo. |
| Sessão, logout e origem confiável | `AuthController`, `JwtAuthGuard` e `CsrfOriginGuard` | `apps/api/test/fixture.integration-spec.ts` e `apps/api/test/progress.integration-spec.ts` | login emite cookie HttpOnly; logout e comandos sem `Origin` confiável retornam 403. |
| Leitura ordenada e bloqueio sequencial | services/repositories de `learning` e estados derivados | `apps/api/test/progress.integration-spec.ts` | acesso direto ao nível bloqueado retorna `LEVEL_BLOCKED`; o E2E o confirma no navegador. |
| Início, cursor, conclusão e liberação | `ProgressService` e `PrismaProgressRepository` | testes unitários, integração e `apps/web/e2e/foundation.spec.ts` | E2E percorre os nove slides, conclui os três níveis e verifica a liberação seguinte. |
| Retomada após nova sessão | snapshot canônico e cursor `currentSlideId` | `apps/web/e2e/foundation.spec.ts` | o E2E sai no segundo slide, cria nova sessão e reabre o mesmo cursor persistido. |
| Acessibilidade básica e responsividade | foco no título, nomes acessíveis, navegação por teclado e CSS responsivo | testes de componentes e E2E | E2E avança por `Enter`; referência desktop e viewport 390 px são comparadas pelo Playwright. |
| Contrato HTTP documentado | Swagger em `/docs`, anotações dos controllers e contratos Zod em `packages/contracts` | validação de body nos testes de integração | OpenAPI descreve autenticação por cookie, `Origin`, UUIDs, corpos estritos, respostas e erros de domínio. |

## Evidência visual

O E2E captura duas imagens como anexos temporários do Playwright:

- `tcc-15-login-desktop.png`: tela de entrada em viewport desktop;
- `tcc-15-reader-mobile.png`: leitor no último slide em viewport de 390 × 844 px.

Elas ficam no diretório de saída `apps/web/test-results/`, já ignorado pelo
Git e preservado mesmo quando a suíte passa. O E2E verifica os marcos
funcionais e, no viewport mobile, a ausência de rolagem horizontal; as imagens
registram a aparência observada, sem converter a suíte em uma comparação de
pixels dependente de plataforma.

## Resultado da execução

`pnpm verify` foi executado em ambiente limpo. O fluxo criou um projeto Compose
temporário, aplicou as quatro migrations, executou o seed duas vezes, validou
os cenários de upgrade, executou `pnpm check`, as suítes de integração e o E2E.
No encerramento, o PostgreSQL, a rede e os volumes temporários foram removidos.

O roteiro de inspeção de até dez minutos está em
`docs/guides/local-setup.md`. A execução navegada pela automação cobre o mesmo
roteiro, inclusive login, logout, bloqueio, retomada, revisão, teclado,
desktop e mobile. A inspeção humana permanece reproduzível por esse roteiro;
ela não deve ser confundida com resultado de avaliação acadêmica.

## OpenAPI e comportamento operacional

Swagger fica disponível em `/docs` quando `SWAGGER_ENABLED=true`. Os endpoints
da jornada usam cookie de sessão; toda mutação também exige o cabeçalho
`Origin` igual a `WEB_ORIGIN`.

| Método e rota | Corpo | Resultado principal |
| --- | --- | --- |
| `GET /learning/islands/:islandKey` | — | ilha e disponibilidade derivada dos níveis. |
| `GET /learning/levels/:levelId` | — | nível ordenado e relações entre slides. |
| `GET /learning/media/:mediaAssetId` | — | mídia autenticada com cache privado. |
| `GET /progress` | — | snapshot sem criar progresso. |
| `POST /progress/levels/:levelId/start` | `{}` | início idempotente no primeiro slide. |
| `PUT /progress/levels/:levelId/current-slide` | `{ "slideId": "uuid" }` | cursor atualizado após transição permitida. |
| `POST /progress/levels/:levelId/complete` | `{}` | conclusão idempotente somente no último slide. |

Falhas usam o envelope de `apiErrorSchema`, incluindo `requestId`. Os códigos
de domínio esperados são `LEVEL_BLOCKED`, `LEVEL_NOT_STARTED`,
`INVALID_SLIDE_TRANSITION` e `LEVEL_NOT_READY_FOR_COMPLETION`.

## Riscos residuais e diferenças perante o legado

| Item | Situação no recorte | Implicação |
| --- | --- | --- |
| Identidade | sessão experimental fixa para `aluna.demo` | não substitui cadastro, recuperação de senha, papéis ou provedores sociais do legado. |
| Conteúdo | uma ilha, três níveis e nove slides, sem CRUD administrativo | não há CMS, upload, múltiplas trilhas nem autoria aberta. |
| Progresso | cursor atual e conclusão por nível; sem percentual, histórico, reset ou conclusão de ilha | o estado é suficiente para a jornada experimental, não para toda a semântica de progresso do produto. |
| Concorrência | última navegação confirmada vence; sem protocolo especial entre abas | uso simultâneo em várias abas não é uma garantia do recorte. |
| Mídia | ativos locais controlados e autenticados | não cobre infraestrutura de upload, conversão, screenshots sociais ou CDN do legado. |
| Avaliação | evidências técnicas e roteiro reproduzível | não demonstram eficácia pedagógica nem validação universal da metodologia proposta. |
