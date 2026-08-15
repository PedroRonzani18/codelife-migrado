# Inventário funcional revalidado do CodeLife legado

**Card:** TCC-3 — Revalidar módulos e funcionalidades documentados do CodeLife

**Data da análise:** 14 de agosto de 2026

**Repositório analisado:** `../codelife`, commit `9f023a464218155e38de0fa98359236ed062fd5a`
**Objetivo:** confrontar a caracterização funcional do TCC com a implementação presente no repositório legado, registrando evidências para as decisões posteriores de classificação e recorte experimental.

## Escopo, método e limites

O ponto de partida foi o quadro de funcionalidades do TCC em
`../TCC/capitulos/06-aplicacao-experimental.tex:84-104`, complementado pelo
checklist funcional CF-01--CF-22 (`:862-904`). A análise rastreou, para cada
eixo, as rotas React, componentes, APIs, modelos Sequelize e integrações
declaradas. Ela é uma análise estática do repositório: comprova que o fluxo
está implementado, mas não que o portal, serviços externos, DNS, banco de
dados ou credenciais estejam operantes hoje.

As classificações deste documento não substituem os estados da linha de base
do TCC. Aqueles estados representam observação em um ambiente específico; os
estados abaixo comparam a descrição acadêmica com a implementação disponível.

| Classificação | Critério usado |
|---|---|
| **Confirmado** | Há implementação identificável de ponta a ponta no código: entrada, interface ou API e dados/regras relevantes. |
| **Parcialmente confirmado** | O núcleo existe, mas há limitação material, dependência externa, permissão/estado não demonstrado, ou parte da afirmação é mais ampla do que o código. |
| **Divergente** | A formulação documentada não descreve com precisão o comportamento implementado. |
| **Descoberto na revalidação** | Capacidade relevante implementada que não aparece como eixo próprio no diagnóstico atual. |

Não foram alterados o legado, o TCC ou a aplicação modernizada nesta tarefa.

## Visão consolidada

| Eixo do TCC | Situação | Conclusão resumida |
|---|---|---|
| Aprendizagem estruturada | **Confirmado** | Há hierarquia ilha → nível → slide, plano de aula e glossário. |
| Atividades educacionais | **Confirmado** | Os tipos de slide e o bloqueio por quiz/código são implementados. |
| Editor e validação de código | **Parcialmente confirmado** | Editor, regras e comunicação existem; execução depende do sandbox externo `codelife.tech`. |
| Progresso do estudante | **Parcialmente confirmado** | Persiste conclusão por nível/ilha, mas não posição por slide nem pré-requisitos no servidor. |
| Projetos e codeblocks | **Confirmado** | CRUD, avaliação final, listagem e visualização compartilhável estão implementados. |
| Colaboração e discussão | **Parcialmente confirmado** | Colaboradores e discussão existem; discussões são efetivamente apenas de slides e há controles frágeis. |
| Busca, perfis e navegação | **Parcialmente confirmado** | Busca/navegação existem, mas perfil completo exige sessão; portanto não é plenamente público. |
| Administração de conteúdo | **Confirmado** | CMS de ilhas, níveis, slides, regras e glossário, com papéis administrativos. |

Os módulos complementares encontrados são: autenticação e papéis, localização por idioma/subdomínio, compartilhamento/social, moderação, ranking, geografia/escolas, concurso e pesquisa. Eles constam em [Funcionalidades descobertas](#funcionalidades-descobertas-na-revalidação).

## Arquitetura e dependências funcionais comuns

- A aplicação é uma SPA React com `react-router`, Redux e o framework Canon. As rotas estão em `codelife/app/routes.jsx:31-77`; a aplicação carrega autenticação, ilhas, níveis e glossário na inicialização (`app/App.jsx:26-28,94-109`).
- A autenticação é fornecida pelo Canon. No backend, `isAuthenticated` usa `req.isAuthenticated()` e os papéis são 0 (usuário), 1 (administrador/contribuidor) e 2 (superusuário): `tools/api.js:4-21`.
- PostgreSQL é uma dependência de persistência; usuários são providos pelo Canon e não possuem modelo local. O README declara variáveis de banco, idiomas e flags de moderação (`README.md:35-53,95-103`).
- Conteúdo educacional e rotas básicas são carregados sem autenticação, enquanto aprendizagem, produção e administração usam guardas de cliente e/ou middleware de API. Por isso, a preservação da autorização deve ser decidida no backend da versão modernizada, não só na interface.
- Há duas dependências de infraestrutura externas à aplicação: o sandbox remoto de execução (`codelife.tech`) e o serviço de captura de tela, que requer Electron/Xvfb. Uploads e capturas são gravados em disco local (`README.md:107-117`; `api/projectsRoute.js:200-229`; `api/codeBlocksRoute.js:68-102`).

## Inventário por eixo funcional

### 1. Aprendizagem estruturada — Confirmado

**Finalidade.** Estruturar o ensino de programação em uma trilha de ilhas,
níveis e slides, complementada por plano de aula e glossário. Corresponde ao
primeiro eixo do TCC e aos itens CF-03 a CF-07.

**Fluxo.** Após autenticação, a pessoa acessa `/island`, seleciona uma ilha
liberada, escolhe um nível e percorre os slides. O mapa calcula a próxima ilha
usando o progresso; a página de ilha reúne níveis, desafio final e codeblocks
da comunidade. O plano de aula disponibiliza a mesma hierarquia em modo de
referência/leitura.

| Entradas e interface | API e dados | Evidências |
|---|---|---|
| `/island`, `/island/:lid`, `/island/:lid/:mlid(/:sid)`; `IslandMap`, `IslandLevel`, `Slide` | `GET /api/islands/all`, `/levels/all`, `/slides/all`, `/islands/nested`; modelos `islands`, `levels`, `slides` | Rotas: `app/routes.jsx:35-38`. Mapa e liberação: `app/pages/IslandMap.jsx:22-31,39-55,68-90`. Árvore e relações: `db/islands.js:10-54`, `db/levels.js:9-36`, `db/slides.js:8-48`. API: `api/islandsRoute.js:21-76`. |
| `/lessonplan(/:lid)`; `LessonPlan` | `GET /api/islands/nested?lang=` | `app/routes.jsx:69-70`; `app/pages/LessonPlan.jsx:24-29,170-187,260-264`. |
| `/glossary`; `Glossary` | `GET /api/glossary/all` e CMS de glossário | `app/routes.jsx:47`; `app/pages/Glossary.jsx:8-14,45-47`; `api/glossaryRoute.js:21-27`. |

**Observações para o recorte.** A relação ilha → nível → slide é o núcleo
mais acoplado do sistema. A API antiga entrega listas planas e a interface as
recompõe; existe também uma alternativa aninhada usada pelo plano de aula
(`api/islandsRoute.js:4-10,52-76`). O glossário possui fontes de carregamento
duplicadas (Redux e Canon Need), devendo ser tratado como dependência de
conteúdo, não como detalhe visual.

### 2. Atividades educacionais — Confirmado

**Finalidade.** Exibir conteúdo instrucional, exemplos e exercícios que
podem bloquear a progressão. O TCC cita quiz, exemplos de código e atividade
de programação; todos têm correspondência direta.

**Fluxo.** `Slide` escolhe o componente pelo campo `type`. Slides `Quiz` e
`InputCode` iniciam bloqueados. Uma resposta correta ou submissão de código
aprovada chama `unblock`, permitindo avançar; conteúdos não bloqueantes são
percorridos normalmente.

| Funcionalidade | Implementação e evidência |
|---|---|
| Tipos de conteúdo | `TextImage`, `ImageText`, `TextText`, `TextCode`, `InputCode`, `RenderCode`, `Quiz` e `CheatSheet`: `app/pages/Slide.jsx:13-26`; a mesma lista é editável no CMS em `app/pages/admin/lessonbuilder/LessonBuilder.jsx:16-25`. |
| Quiz bloqueante | Dados em `slides.quizjson`; resposta correta libera a aula: `db/slides.js:22-25`; `app/components/slidetypes/Quiz.jsx:21-37,56-86`. |
| Exercício de código bloqueante | Regras em `slides.rulejson`; `InputCode` só chama `unblock` quando `CodeEditor.isPassing()`: `app/components/slidetypes/InputCode.jsx:31-38,59-75`. |
| Regra de bloqueio | `Slide` bloqueia `InputCode` e `Quiz`, liberando o próximo slide somente após o evento adequado: `app/pages/Slide.jsx:78-89,135-166,359-402`. |

**Dependências.** Tipos de slide, conteúdo HTML, quiz JSON e regra JSON são
dados editoriais. Alterar o editor ou o modelo de conteúdo sem uma estratégia
de migração desses formatos afeta diretamente este eixo.

### 3. Editor, prévia e validação de código — Parcialmente confirmado

**Finalidade.** Permitir edição de HTML/JavaScript, prévia, execução e
validação com mensagens. O núcleo descrito no TCC existe, porém a execução
integral requer um domínio externo e páginas de sandbox hospedadas.

**Fluxo.** O `CodeEditor` carrega regras de mensagem, recebe o texto no Ace,
analisa HTML/JS localmente e calcula aprovação. A prévia recebe HTML sem
scripts a cada edição. Quando a pessoa executa, o código é instrumentado e
enviado por `postMessage` ao iframe de `https://codelife.tech`; console,
erros, estado de regras e conclusão retornam por `postMessage`.

| Componente/entrada | API e dados | Evidências |
|---|---|---|
| `CodeEditor`, usado por `InputCode`, `RenderCode`, `CodeBlockEditor` e `Projects` | `GET /api/rules`; `rules`, `slides.rulejson`, `islands.rulejson` | Estrutura editor/iframe: `app/components/CodeEditor/CodeEditor.jsx:17-20,27-60`. Validação local: `:117-135,226-265`. Carregamento de regras: `:320-335`. Dados: `db/rules.js:1-31`, `db/slides.js:22-37`, `db/islands.js:20-44`. |
| Sandbox e execução | páginas em `sandbox/`, domínio `codelife.tech` | Origem, handshake e validação da origem: `CodeEditor.jsx:66-87,138-158`; preparação da execução: `:448-460`; contrato externo: `README.md:107-113`; receiver: `sandbox/sandbox.js:3-10,51-108`. |
| Mensagens de validação | `/api/rules`, `DrawerValidation` | `api/rulesRoute.js:19-44`; `app/components/CodeEditor/DrawerValidation.jsx`. |

**Divergências e risco.** A caracterização do TCC é adequada quanto à
existência de sandbox, iframe e `postMessage`. Ela deve permanecer cautelosa
quanto à disponibilidade operacional do sandbox: o repositório contém as
páginas fonte, mas não comprova a hospedagem atual em `codelife.tech`.
Esse é um acoplamento crítico para qualquer recorte que preserve execução de
JavaScript.

### 4. Progresso do estudante — Parcialmente confirmado

**Finalidade.** Controlar desbloqueio, registrar conclusão e orientar a
navegação educacional. A persistência existe, mas seu modelo é mais simples
que uma trilha detalhada por slide.

**Fluxo.** Ao alcançar o último slide de um nível, a interface grava
`completed`; se a pessoa abre a discussão, o nível pode ser gravado como
`skipped`. Ao superar o CodeBlock final, grava a ilha como `completed`. O mapa
e as páginas consultam o histórico para liberar ilhas/níveis e apresentar o
percurso atual.

| Aspecto | Implementação e evidência |
|---|---|
| Persistência | `GET /api/userprogress/mine` e `POST /api/userprogress/save`; o segundo usa `findOrCreate`, registra data e impede que `completed` seja rebaixado: `api/userprogressRoute.js:19-68`. |
| Estados de aula | Final da aula salva `completed` ou `skipped`; abrir discussão exige confirmação e marca `skipped`: `app/pages/Slide.jsx:91-102,161-166,230-250`. |
| Estado de desafio final | CodeBlock aprovado salva a ilha como `completed`: `app/components/CodeBlockEditor.jsx:94-102,158-186`. |
| Estrutura de dados | `userprogress(uid, level, datecompleted, status)` mistura IDs de nível e ilha; `gems` é depreciado: `db/userprogress.js:1-24`. |

**Limitações relevantes.** O próprio componente informa que
`latestSlideCompleted` só vive em memória e reinicia quando se sai da aula
(`app/pages/Slide.jsx:28-35`). A API não valida se o ID recebido existe, se
pré-requisitos foram atendidos ou se o status corresponde a uma atividade
aprovada. Portanto, a formulação “salvamento e acompanhamento de progresso”
é confirmada, mas não deve ser interpretada como checkpoint granular ou como
garantia de integridade no servidor.

### 5. Projetos e codeblocks — Confirmado

**Finalidade.** Criar, editar, visualizar e compartilhar produções. Projeto
é uma página/código HTML persistido; CodeBlock é tanto produção compartilhável
quanto desafio final associado a uma ilha.

**Fluxos.** A área `/projects/:username` carrega projetos próprios e em
colaboração, cria/edita/remove e usa o editor. Salvar produz screenshot e
oferece compartilhamento. O desafio final da ilha aceita somente código
aprovado, salva o CodeBlock e marca progresso. Links públicos por usuário e
slug abrem `Share` para projetos e CodeBlocks.

| Funcionalidade | Entradas, APIs e dados | Evidências |
|---|---|---|
| CRUD de projetos | `/projects/:username`, `/projects/:user/:filename/edit`; `GET /mine,/collabs,/byid`, `POST /new,/update`, `DELETE /delete`; `projects` | Rotas: `app/routes.jsx:40-42`. Tela: `app/pages/Projects.jsx:20-23,53-171,242-383`. API: `api/projectsRoute.js:71-108,137-157,238-284,313-385`. Modelo: `db/projects.js:3-54`. |
| CodeBlock final | `CodeBlockEditor`; `POST /api/codeBlocks/new|update`; `codeblocks` | `app/components/CodeBlockEditor.jsx:17-21,158-215`; `api/codeBlocksRoute.js:109-176`; `db/codeBlocks.js:3-53`. |
| Visualização/compartilhamento | `/projects/:username/:filename`, `/codeBlocks/:username/:filename`; consultas por username/slug; Open Graph e screenshot | `app/routes.jsx:40-42,55`; `app/pages/Share.jsx:52-145,150-154`; `api/projectsRoute.js:115-131,185-197`; `api/codeBlocksRoute.js:68-102,204-251`. |
| Curtidas, denúncia e bifurcação de CodeBlock | `likes`, `reports`; `CodeBlockCard` | `app/components/CodeBlockCard.jsx:36-50,90-130,303-416`; `api/likesRoute.js:16-27`; `api/reportsRoute.js:241-273`. |

**Observações.** O modelo não evidencia unicidade de `(uid, lid)` para
CodeBlock, embora a intenção seja um desafio por estudante/ilha. No backend,
a criação e atualização de CodeBlock usa `uid` recebido no corpo da requisição
em vez de vinculá-lo inequivocamente a `req.user.id`
(`api/codeBlocksRoute.js:109-110,146-150`). Isso não altera a confirmação da
funcionalidade, mas é risco de autorização e de migração. A geração de imagem
está duplicada em projetos e CodeBlocks e é assíncrona; depende de disco local,
Electron e Xvfb.

### 6. Colaboração e discussão — Parcialmente confirmado

**Finalidade.** Permitir colaboração em projetos e conversas em torno do
conteúdo. As duas capacidades existem, mas não no escopo genérico que algumas
descrições do TCC podem sugerir.

**Fluxo de colaboração.** O proprietário pesquisa pessoas, inclui/remove
colaboradores; convidadas podem abrir e abandonar o projeto. A relação N:M é
registrada em `projects_userprofiles`.

**Fluxo de discussão.** Em uma aula, a pessoa solicita abertura da discussão,
o que pode marcar a aula como `skipped`; então pode criar Thread, comentar,
curtir e denunciar. A API carrega a árvore de comentários e aplica ocultação/
banimento por denúncias ou privacidade.

| Capacidade | Implementação e evidência |
|---|---|
| Colaboradores de projeto | UI e limite de cinco no cliente: `app/pages/Projects.jsx:586-633,794-810`; pesquisa/adição/remoção: `app/components/CollabSearch.jsx:48-110`; relação e APIs: `db/projects.js:49-54`, `db/projects_userprofiles.js:1-23`, `api/projectsRoute.js:338-361`. |
| Threads e comentários | `Discussion`, `Thread`, `Comment`; `GET /api/threads/all`, `POST /threads/new`, `/comments/new`: `app/components/Discussion.jsx:35-99`, `app/components/Thread.jsx:43-82`; `api/threadsRoute.js:19-208`. |
| Vínculo aos dados | A associação de Thread declara que o uso atual é **somente slide**: `db/threads.js:1-42`. |
| Curtidas/moderação | Likes idempotentes e Reports por tipo: `api/likesRoute.js:16-27`, `api/reportsRoute.js:53-180,241-273`; filtros de conteúdo: `api/threadsRoute.js:66-106`. |

**Divergência.** O TCC fala em “discussões associadas a conteúdo” de forma
compatível com slides, mas a documentação gerada sugere possível expansão para
projetos e CodeBlocks. O código declara explicitamente que somente `slide` é
o tipo atual (`db/threads.js:2-5`; `api/threadsRoute.js:8-17`). Assim,
discussões em projetos/CodeBlocks não devem entrar no recorte como capacidade
existente.

**Riscos.** `addcollab` e `removecollab` exigem sessão, mas não confirmam que
o solicitante seja proprietário do projeto (`api/projectsRoute.js:338-350`).
No frontend, denúncia de comentário é encaminhada como `contentType="thread"`
(`app/components/Comment.jsx:151-156`), embora `ReportBox` suporte
`comment` (`app/components/ReportBox.jsx:30-33,60-67`). Este último é um
defeito concreto que afeta a moderação de comentários.

### 7. Busca, perfis e navegação — Parcialmente confirmado

**Finalidade.** Localizar usuários/projetos, acessar perfis e navegar pela
trilha. Busca e navegação estão implementadas; o termo “perfis públicos”
precisa ser qualificado.

| Função | Implementação e evidência |
|---|---|
| Navegação por percurso concluído | `Browser` carrega ilhas, níveis, slides e progresso e bloqueia links não concluídos: `app/components/Browser.jsx:38-58,83-149,192-250`. Mapa e ilha também usam progresso: `IslandMap.jsx:39-55`; `IslandLevel.jsx:239-259`. |
| Busca global | `Search` procura usuários/projetos após três caracteres; `GET /api/search` e `/api/searchusers` exigem autenticação: `app/components/Search.jsx:32-45,96-145`; `api/searchesRoute.js:21-87`. O README declara dependência de `pg_trgm`: `README.md:135-151`. |
| Perfil e edição | `/profile/:username`, `/profile/:username/edit`; perfil, avatar, bio, escola/localidade, projetos e CodeBlocks: `app/routes.jsx:44-45`; `app/pages/profile/Profile.jsx:57-112,195-227`; `EditProfile.jsx:33-125`; `api/profile.js:45-51,77-121,241-302`. |
| Ranking | `/leaderboard` e `GET /api/stats/public`: `app/routes.jsx:72`; `app/pages/Leaderboard.jsx:28-54,70-139`; `api/statsRoute.js:58-93`. |

**Divergência.** A página de perfil completo e `GET /api/profile/:username`
exigem sessão; sem sessão, somente `/api/profile/share/:username` expõe dados
mínimos para compartilhamento (`api/profile.js:77-121`). Logo, “perfis
públicos” é uma aproximação: há rota compartilhável, mas o perfil funcional
completo não é público na API.

**Observações de risco.** `GET /api/profile/byid/all` não exige autenticação e
retorna e-mails em consulta por escola/localidade (`api/profile.js:187-222`).
Além disso, a busca de projetos retorna conteúdo sem usar o filtro de
visibilidade aplicado em outras listagens (`api/searchesRoute.js:72-83`). São
evidências para uma futura revisão de privacidade, não para ampliar o escopo
funcional deste card.

### 8. Administração de conteúdo — Confirmado

**Finalidade.** Manter conteúdos educacionais e operar aspectos administrativos.
Embora o TCC o apresente como “indício”, o código confirma um CMS completo
para o conteúdo central.

**Fluxo.** Quem tem papel 1 acessa `/admin`, abre a árvore ilha → nível →
slide, cria/edita/remove/reordena conteúdo e define a ilha mais recente. O
mesmo painel edita glossário e mensagens de regra. Papel 2 também administra
denúncias, papéis, estatísticas e destaque de produções.

| Área | Entradas e APIs | Evidências |
|---|---|---|
| Painel e papéis | `/admin` e rotas aninhadas; papel >=1, abas sensíveis >=2 | `app/routes.jsx:57-61`; `app/pages/admin/AdminPanel.jsx:29-40,80-88`; `tools/api.js:10-21`. |
| Conteúdo didático | Builder de ilhas/níveis/slides: `GET all`, `POST new/save`, `DELETE delete`, `setlatest`, upload de slide | `app/pages/admin/lessonbuilder/LessonBuilder.jsx:38-245`; `api/builderRoute.js:19-141,160-188`. |
| Regras e glossário | `/api/rules/all|save`; `/api/builder/glossary/*` | `app/pages/admin/lessonbuilder/RuleBuilder.jsx:20-51`; `app/pages/admin/GlossaryBuilder.jsx:21-97`; `api/rulesRoute.js:19-44`. |
| Operação | Denúncias, usuários, estatísticas, destaque e screenshots | `app/pages/admin/ReportViewer.jsx:29-160`; `UserRoles.jsx:20-44`; `Statistics.jsx:29-47`; `Featured.jsx:24-90`; APIs em `api/reportsRoute.js:53-180` e rotas de projetos/CodeBlocks. |

**Dependências e impacto.** O CMS manipula diretamente estruturas legadas
(campos HTML, JSON de quiz/regras, ordem e campos PT). Não há validação de
payload nem deleção em cascata explícita nas rotas do builder. A migração de
qualquer subconjunto educacional deve preservar ou converter esses formatos.

## Funcionalidades descobertas na revalidação

| Funcionalidade | Situação | Evidências e implicação |
|---|---|---|
| Autenticação, cadastro, recuperação de senha e papéis | **Descoberto — Confirmado** | Canon fornece sessão e usuários; Login/Signup integram provedores sociais; logout e reset existem: `README.md:95-103`; `app/components/LoginForm.jsx:109-125`; `SignupForm.jsx:173-191`; `Nav.jsx:137-143`; `routes.jsx:74`. É uma dependência transversal de quase todos os fluxos. |
| Internacionalização por subdomínio | **Descoberto — Parcialmente confirmado** | Aplicação redireciona PT/EN conforme host e perfil: `app/App.jsx:34-70`; conteúdo usa campos `pt_*`: `tools/translateObjArray.js:2-16`; README define subdomínios: `README.md:56-66`. A lógica existe, mas DNS/hospedagem não foram observados. |
| Compartilhamento social e screenshots | **Descoberto — Confirmado** | Links diretos, Facebook/Open Graph e capturas: `Share.jsx:74-106`; `ShareFacebookLink.jsx:38`; `api/projectsRoute.js:200-229`; `api/codeBlocksRoute.js:68-102`. Depende de geração de imagem em infraestrutura. |
| Moderação por denúncias e destaque | **Descoberto — Parcialmente confirmado** | Reports, banimento, e-mail Mailgun e destaque existem: `api/reportsRoute.js:3-10,241-273`; `ReportViewer.jsx:29-160`. A quota mensal declarada não é garantida pela rota de criação de denúncia; ela permite duplicados. |
| Geografia, escola e checkpoints | **Descoberto — Confirmado** | Perfil mantém escola/localidade; a jornada solicita escola/e-mail: `db/userprofiles.js:1-63`; `db/schools.js:7-31`; `app/pages/IslandLevel.jsx:269-318`. É coleta complementar, não pré-requisito do conteúdo. |
| Concurso de projetos | **Descoberto — Parcialmente confirmado / desativado** | API e componentes existem, mas rota `/contest` e aba administrativa estão comentadas e o componente declara “currently postponed”: `app/routes.jsx:26,65`; `app/pages/Contest.jsx:13-16`; `api/contestentriesRoute.js:15-48`; `AdminPanel.jsx:87`. Não deve integrar o núcleo a preservar sem decisão posterior. |
| Pesquisa | **Descoberto — Parcialmente confirmado / legado** | Rota e API existem, mas o componente identifica a pesquisa de beta de 2017 como concluída/depreciada: `app/routes.jsx:49`; `app/pages/Survey.jsx:7-10,34-67`; `api/survey.js:3-20`. |
| Usuários por escola/localidade | **Descoberto — Desativado na interface** | Componente e API existem, porém sua inclusão na página de perfil está comentada: `app/pages/profile/UsersList.jsx:34-35`; `Profile.jsx:220-225`; `api/profile.js:187-222`. |
| Configurações e buscas persistidas antigas | **Descoberto — Desativado** | `siteconfigs` e `searches` são marcados como UNUSED: `db/siteconfigs.js:1-20`; `db/searches.js:1-27`. |

## Inventário de rotas de interface

| Grupo | Rotas |
|---|---|
| Institucional/público | `/`, `/about`, `/privacy`, `/learnmore`, `/contact`, `/glossary`, `/lessonplan(/:lid)` |
| Aprendizagem autenticada | `/island`, `/island/:lid`, `/island/:lid/show`, `/island/:lid/:mlid(/:sid)` |
| Produções e compartilhamento | `/projects/:username`, `/projects/:username/:filename`, `/projects/:user/:filename/edit`, `/codeBlocks/:username/:filename` |
| Perfis e conta | `/profile/:username`, `/profile/:username/edit`, `/reset` |
| Administração | `/admin`, `/admin/:tab`, `/admin/:tab/:island`, `/admin/:tab/:island/:level`, `/admin/:tab/:island/:level/:slide` |
| Complementares | `/leaderboard`, `/survey`; `/contest` está comentada/desabilitada |

Fonte: `codelife/app/routes.jsx:31-77`.

## Inventário condensado de APIs

| Domínio | Endpoints observados | Acesso esperado |
|---|---|---|
| Conteúdo | `GET /api/islands/all`, `/levels/all`, `/slides/all`, `/islands/nested`, `/glossary/all`, `/rules` | público |
| CMS | `/api/builder/islands|levels|slides/{all,new,save,delete}`, `/builder/setlatest`, `/builder/glossary/{all,new,save,delete}`, `/slideImgUpload`, `/rules/all|save` | papel >=1 |
| Progresso | `GET /api/userprogress/mine`, `POST /api/userprogress/save` | autenticado |
| Projetos | `GET /projects/mine,/collabs,/byid,/byuser`; `POST /new,/update,/addcollab,/removecollab,/leavecollab`; `DELETE /delete`; `GET /featured,/byUsernameAndFilename` | misto; compartilhamento público |
| CodeBlocks | `GET /codeBlocks/mine,/byuser,/all,/featured,/byUsernameAndFilename`; `POST /new,/update` | misto; compartilhamento público |
| Social/moderação | `GET /threads/all`; `POST /threads/new,/comments/new,/likes/save,/reports/save`; rotas de status/filas | leitura de threads pública; escrita autenticada; moderação papel >=2 |
| Perfil/busca/ranking | `/profile/*`, `/schools*`, `/geos`, `/search`, `/searchusers`, `/stats/public`, `/stats` | majoritariamente autenticado; exceções registradas no texto |
| Complementares | `/contest`, `/contest/status`, `/contest/admin`, `/survey`, `/siteconfigs` | concurso/survey não são fluxo ativo confirmado |

Para métodos, permissões e implementação exata, consultar os arquivos de rota
correspondentes em `codelife/api/`; esta tabela é um índice, não uma especificação
de contrato para a versão modernizada.

## Rastreabilidade com o checklist do TCC

| Itens do checklist | Resultado da revalidação | Local principal |
|---|---|---|
| CF-01--02: PT e EN | Parcialmente confirmado: lógica de locale/subdomínio e campos PT existem; operação dos domínios não foi verificada | `App.jsx:34-70`; `tools/translate*.js`; `README.md:56-66` |
| CF-03--06: ilhas, níveis, slides, trilha | Confirmado | `routes.jsx:35-38`; `IslandMap.jsx`; `IslandLevel.jsx`; `Slide.jsx`; `islandsRoute.js` |
| CF-07: conteúdo de slides | Confirmado | `Slide.jsx:13-26`; `db/slides.js:14-37` |
| CF-08: quiz bloqueante | Confirmado | `Quiz.jsx:21-37`; `Slide.jsx:78-89` |
| CF-09: atividade de código bloqueante | Confirmado, dependente do editor/sandbox | `InputCode.jsx:59-75`; `CodeEditor.jsx` |
| CF-10--12: editor, prévia, mensagens | Parcialmente confirmado: implementação presente; sandbox externo não executado nesta análise | `CodeEditor.jsx:17-20,138-158,226-265,448-460` |
| CF-13: progresso | Parcialmente confirmado: por nível/ilha, sem checkpoint por slide | `Slide.jsx:91-102`; `userprogressRoute.js:19-68` |
| CF-14--16: projetos, CodeBlocks, visualização/compartilhamento | Confirmado | `Projects.jsx`; `CodeBlockEditor.jsx`; `Share.jsx`; rotas `projectsRoute.js` e `codeBlocksRoute.js` |
| CF-17: colaboração | Parcialmente confirmado: associação e UI confirmadas, autorização necessita revisão | `CollabSearch.jsx`; `projectsRoute.js:338-361` |
| CF-18: compartilhar conteúdo | Confirmado, com dependência de screenshot para mídia social | `Share.jsx`; `ShareFacebookLink.jsx` |
| CF-19: discussão, threads e comentários | Parcialmente confirmado: confirmados para slides; não para projetos/CodeBlocks | `Discussion.jsx`; `threadsRoute.js`; `db/threads.js` |
| CF-20: busca | Confirmado para usuários e projetos autenticados | `Search.jsx`; `searchesRoute.js` |
| CF-21: perfis públicos | Divergente: perfil completo exige autenticação; share limitado é público | `profile.js:77-121` |
| CF-22: disponibilidade do fluxo inicial | Não determinada | Este inventário não executou o portal nem seus serviços externos |

## Dependências e acoplamentos para decisões posteriores

1. **Núcleo pedagógico:** ilha, nível, slide, quiz/regra, progresso e desafio
   final são fortemente acoplados. Migrar somente uma tela de aula sem definir
   os formatos de conteúdo e o progresso deixa o fluxo incompleto.
2. **Execução de código:** o editor depende de um contrato entre frontend,
   páginas do sandbox, `postMessage`, origem permitida e loop protection. É o
   maior acoplamento externo do diagnóstico.
3. **Produções:** projetos e CodeBlocks compartilham editor, preview,
   screenshot e moderação. A captura é infraestrutura separada, mas afeta
   compartilhamento social e cartões de conteúdo.
4. **Social:** colaboração de projetos, perfis, busca, likes, denúncias e
   discussão compartilham identidade, perfil e regras de visibilidade. A
   discussão é específica de slides apesar do desenho polimórfico.
5. **Conteúdo administrativo:** o CMS manipula as mesmas entidades da trilha
   e seus formatos serializados. Deve ser considerado junto da migração do
   conteúdo, mesmo que o painel não entre no primeiro recorte.
6. **Dados legados:** relações polimórficas em likes/reports/threads e campos
   depreciados (`gems`, `coins`, `streak`, `previewblob`, `permalink`,
   `eligible`) exigem classificação explícita antes de qualquer conversão.

## Conclusão para o card TCC-3

Todos os oito eixos funcionais descritos no TCC foram confrontados com o
código. A revalidação confirma que a caracterização acadêmica identifica o
núcleo do sistema, mas requer três ajustes de precisão para tarefas posteriores:

1. tratar editor/execução, progresso, colaboração e perfis como capacidades
   com limites explícitos, e não como fluxos completos sem ressalvas;
2. registrar que discussões são implementadas para slides, enquanto o perfil
   completo não é público sem sessão;
3. considerar como evidências adicionais autenticação, CMS, moderação,
   localização, compartilhamento, ranking e os módulos concurso/pesquisa
   desativados.

O relatório oferece uma base de módulos, entradas, APIs, dados, dependências
e divergências para a classificação de risco e para definir um recorte
experimental de modernização sem presumir que os serviços externos estejam
operacionais.
