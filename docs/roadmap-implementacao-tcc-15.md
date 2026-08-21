# Roadmap de implementação do TCC-15

## Trilha autenticada com navegação persistida, liberação e conclusão por nível

**Repositório-alvo:** `codelife-migrado`

**Card:** TCC-15 — Entregar a trilha autenticada com liberação e progresso por nível

**Data de consolidação:** 20 de agosto de 2026

**Estado deste documento:** Macroetapa 1 concluída; Macroetapas 2, 3 e 4 pendentes

**Quantidade fixa de macroetapas:** 4

**Resultado esperado:** uma fatia vertical executável, testada, demonstrável e rastreável da jornada autenticada da `island-3`

---

## 1. Finalidade deste roadmap

Este documento consolida as decisões técnicas discutidas para o TCC-15 e as
organiza em quatro macroetapas de implementação. Ele foi escrito para servir
como contexto de retomada em sessões futuras, evitando que decisões já tomadas
sejam reabertas ou que a implementação siga contratos antigos incompatíveis.

O roadmap deve orientar a implementação no repositório `codelife-migrado`,
preservando os padrões entregues pelo TCC-14:

```text
web: app → modules → features → api/shared
api: module → feature → controller → service → repository port
     → Prisma repository → PrismaService
contracts: schemas Zod e tipos públicos, sem modelos Prisma
```

As quatro macroetapas são dependentes e devem ser executadas em ordem:

```text
1. Consolidar decisões, contratos e modelo de dados ✅ concluída
  → 2. Implementar API, persistência e regras de domínio
    → 3. Implementar a jornada completa no frontend
      → 4. Fechar testes, evidências e validação humana
```

Testes unitários e de integração relacionados a uma macroetapa devem ser
produzidos junto com ela. A Macroetapa 4 não é um depósito para testes que
deveriam ter acompanhado a implementação; ela fecha a validação vertical,
reprodutibilidade, evidências e documentação.

---

## 2. Relação com decisões anteriores

### 2.1 Fontes que continuam válidas

Continuam aplicáveis, salvo quando este roadmap registrar alteração explícita:

- ADR 0001 — monorepo com pnpm e Turbo;
- ADR 0002 — identidade experimental;
- ADR 0004 — contratos Zod e erros padronizados;
- ADR 0005 — seed idempotente e banco isolado;
- ADR 0006 — gates de qualidade e evidências;
- ADR 0007 — observabilidade e saúde;
- ADR 0008 — organização feature-first da API;
- ADR 0009 — ports explícitos para persistência;
- fundação executável e evidências do TCC-14;
- regras de autenticação, cookie, CORS e proteção de origem existentes;
- recorte de uma ilha, três níveis e nove slides controlados;
- exclusão de quiz, editor, sandbox, CodeBlocks, projetos, discussões, busca,
  ranking, CMS e demais módulos externos à jornada.

### 2.2 Decisões substituídas

Este roadmap altera deliberadamente decisões registradas no TCC-11, no ADR
0003 e na redação atual do TCC-15.

As seguintes formulações antigas deixam de representar o contrato-alvo:

- progresso exclusivamente por nível, sem cursor de slide;
- ausência de persistência ao abrir ou navegar por conteúdo;
- existência de progresso somente quando o nível é concluído;
- hierarquia física direta `Island → Level → Slide` sem entidades de
  posicionamento;
- estado de disponibilidade limitado a `available`, `blocked` e `completed`.

O novo contrato preserva a **conclusão por nível**, mas adiciona persistência da
localização atual da pessoa dentro do nível. A navegação passa a ser uma
adaptação deliberada do recorte e deve ser registrada como tal na rastreabilidade
acadêmica e na avaliação posterior.

Antes de alterar código funcional, a Macroetapa 1 deve:

1. atualizar ou substituir o ADR 0003;
2. registrar um novo ADR para o modelo composicional e o progresso contextual;
3. alinhar a decisão local do TCC-11;
4. alinhar os critérios e a descrição do TCC-15;
5. registrar que a mudança é uma decisão aprovada, não uma descoberta do
   legado;
6. preservar o legado como linha de base, sem alegar equivalência estrita para
   o novo cursor por slide.

Qualquer atualização externa no Jira só deve ser feita quando houver autorização
explícita na sessão correspondente. O documento local pode ser preparado antes.

---

## 3. Objetivo funcional consolidado

Entregar uma fatia vertical modernizada na qual uma pessoa autenticada possa:

1. entrar no ambiente experimental;
2. abrir a única trilha disponível;
3. acessar a `island-3`;
4. visualizar três níveis em ordem determinística;
5. iniciar somente o primeiro nível disponível;
6. navegar sequencialmente por três slides não bloqueantes;
7. persistir exatamente o slide atual;
8. retomar a última localização após recarga ou nova sessão;
9. concluir explicitamente o nível quando estiver no último slide;
10. liberar o próximo nível somente após a conclusão do anterior;
11. revisitar qualquer slide de um nível concluído;
12. concluir os três níveis sem duplicar ou rebaixar conclusões;
13. recuperar uma recomendação de continuidade distinta da última tela
    visitada.

Jornada mínima:

```text
login experimental
  → abrir a trilha única
    → abrir island-3
      → nível 1 disponível; níveis 2 e 3 bloqueados
        → iniciar nível 1 no primeiro slide
          → navegar 1 → 2 → 3 com persistência confirmada
            → concluir explicitamente o nível 1
              → liberar nível 2
                → repetir até concluir nível 3
                  → sair e iniciar nova sessão
                    → recuperar conclusão e última localização
```

---

## 4. Escopo e limites

### 4.1 Incluído

- uma trilha explícita tratada como singleton;
- uma ilha experimental `island-3`;
- três níveis e nove posicionamentos de slide;
- conteúdo atômico reutilizável;
- composição por tabelas de posicionamento;
- tipos `TextText`, `TextImage` e `TextCode`;
- imagens locais/controladas;
- login experimental já existente;
- progresso contextual por trilha, ilha e nível;
- cursor persistido no slide atual;
- estados `available`, `in_progress`, `blocked` e `completed`;
- liberação sequencial no servidor;
- conclusão explícita e idempotente;
- rotas endereçáveis por nível e slide;
- proteção por sessão e origem;
- testes unitários, integração PostgreSQL e E2E Playwright;
- documentação, matriz de rastreabilidade e roteiro manual.

### 4.2 Fora do escopo

- múltiplas trilhas selecionáveis pela interface;
- catálogo, busca ou gestão de trilhas;
- conclusão de ilha ou de trilha;
- percentuais persistidos em múltiplas camadas;
- histórico de visitas ou telemetria pedagógica;
- `furthestLevelSlideId` ou maior posição alcançada;
- controle otimista por `revision` ou `expectedRevision`;
- sincronização avançada entre múltiplas abas;
- estado `skipped`;
- quiz ou atividade bloqueante;
- editor, execução de código, sandbox, iframe ou `postMessage`;
- CMS, upload ou administração de conteúdo;
- versionamento formal de conteúdo;
- invalidação automática de progresso após edição;
- migração de progresso histórico;
- dependência obrigatória de S3, R2 ou outro serviço externo;
- deploy ou substituição do legado em produção;
- alteração do banco ou código do CodeLife legado.

---

## 5. Estado atual da fundação

### 5.1 Stack e organização

O TCC-14 já entrega:

- monorepo pnpm/Turbo;
- API NestJS;
- PostgreSQL e Prisma;
- frontend React/Vite;
- React Router instalado, ainda não integrado à jornada;
- TanStack Query;
- schemas Zod em `packages/contracts`;
- autenticação experimental por JWT em cookie HTTP-only;
- guards globais de autenticação e origem;
- filtros de erro e request ID;
- ports de persistência e repositories Prisma;
- fixture repetível `1 × 3 × 9`;
- scripts `check`, cobertura e `verify`;
- banco PostgreSQL efêmero em Docker para verificação completa.

### 5.2 Limitações atuais

- `Island`, `Level` e `Slide` usam relações diretas;
- ordenação fica nos próprios filhos;
- `UserProgress` representa apenas conclusão por nível;
- `completedAt` é obrigatório;
- a leitura da ilha marca provisoriamente todos os níveis como disponíveis;
- não existe leitura completa de nível;
- não existe módulo funcional de progresso;
- não existe roteamento de páginas no frontend;
- a interface atual demonstra apenas a fundação;
- o seed pressupõe zero progresso em sua verificação;
- integração e E2E usam o mesmo banco sequencialmente durante `verify`;
- o cliente de API descarta `code`, `details` e `requestId` dos erros.

---

## 6. Decisões técnicas consolidadas

### 6.1 Trilha única explícita

O produto será tratado como possuidor de uma única trilha, coerente com o
CodeLife observado. Apesar de singleton na interface, a trilha será uma entidade
explícita no banco.

```text
Trail
  └─ TrailIsland
       └─ Island
```

Não haverá seletor de trilha. A explicitação evita manter ordenação global em
`Island` e permite uma evolução futura sem redesenhar toda a hierarquia.

### 6.2 Conteúdo atômico e posicionamentos

Conteúdo e localização na composição são conceitos separados:

```text
Trail → TrailIsland → Island → IslandLevel → Level → LevelSlide → Slide
```

- `Slide` contém o conteúdo atômico;
- `LevelSlide` define onde um slide aparece dentro de um nível;
- `Level` pode ser reutilizado;
- `IslandLevel` define onde um nível aparece dentro de uma ilha;
- `Island` pode ser reutilizada;
- `TrailIsland` define onde uma ilha aparece dentro da trilha;
- o mesmo conteúdo pode aparecer mais de uma vez na mesma composição;
- cada posicionamento possui identidade própria.

### 6.3 Ordenação, sem lista ligada

Não serão persistidos `nextSlideId` ou `previousSlideId`.

Cada posicionamento possui `position`. A sequência é ordenada no servidor e os
vínculos anterior/próximo são derivados na resposta.

Restrições mínimas:

```text
UNIQUE(trailId, position)  em TrailIsland
UNIQUE(islandId, position) em IslandLevel
UNIQUE(levelId, position)  em LevelSlide
CHECK(position > 0)
```

A fixture deve usar posições consecutivas `1`, `2` e `3`. O banco exige
posição positiva e não duplicada, mas não precisa impor ausência universal de
lacunas; a integridade da fixture cobre a sequência exata.

### 6.4 Identificadores e URLs

- entidades e posicionamentos usam UUID como chave técnica;
- `Trail` possui slug de negócio estável;
- `Island` possui slug estável, incluindo `island-3`;
- níveis e slides não precisam armazenar slug;
- slugs de nível e slide são derivados do título no frontend;
- a API resolve níveis e slides pelo UUID do posicionamento;
- slugs decorativos não participam da autorização nem da identidade.

Formato conceitual de URL:

```text
/learn/island-3
/learn/island-3/levels/{islandLevelUuid}/variaveis-js
/learn/island-3/levels/{islandLevelUuid}/variaveis-js/
  slides/{levelSlideUuid}/declarando-valores
```

Slug incorreto ou antigo não invalida o UUID. A interface pode substituir a
rota pela forma canônica sem tratar o slug como chave.

### 6.5 Reutilização e progresso contextual

Progresso nunca deve vazar entre usos do mesmo conteúdo:

- concluir um nível em uma ilha não conclui outro posicionamento do mesmo
  `Level`;
- usar a mesma ilha em outra trilha cria contexto de progresso independente;
- equivalência ou aproveitamento de conteúdo exigiria uma regra futura
  explícita;
- progresso referencia posicionamentos, não apenas entidades atômicas.

### 6.6 Edição de conteúdo e estrutura

- editar conteúdo de `Slide` não invalida progresso;
- quem revisitar um slide verá o conteúdo atualizado;
- reordenar, adicionar ou remover posicionamentos não rebaixa conclusões
  existentes automaticamente;
- se uma alteração precisar exigir nova conclusão, a responsabilidade é criar
  uma nova composição, nível ou trilha;
- essas regras são políticas de modelo, não autorização para implementar CMS;
- edição e administração continuam fora do TCC-15.

### 6.7 Polimorfismo dos slides

Será usado o padrão **Class Table Inheritance** com tabelas relacionais normais,
sem herança nativa do PostgreSQL e sem JSONB discriminado.

```text
Slide
  ├─ TextTextSlide
  ├─ TextImageSlide
  └─ TextCodeSlide
```

Campos propostos:

```text
Slide
  id
  title
  type

TextTextSlide
  slideId
  primaryText
  secondaryText?

TextImageSlide
  slideId
  text
  mediaAssetId
  altText

TextCodeSlide
  slideId
  text
  code
  language
```

Regras:

- textos pedagógicos são texto simples;
- nenhum conteúdo é renderizado como HTML arbitrário;
- `TextCode` é somente leitura;
- nenhum código é executado;
- cada `Slide` deve possuir exatamente um subtipo coerente com `type`;
- a integridade entre base e subtipo é garantida pelo repository transacional,
  verificação do seed e testes;
- não será criado trigger diferível neste card;
- inconsistência encontrada na leitura causa falha explícita, nunca resposta
  parcial silenciosa.

### 6.8 Ativos de imagem

Imagens são objetos controlados e referenciados por metadados:

```text
MediaAsset
  id
  objectKey
  mimeType
  sizeBytes?
  width?
  height?
  checksum?
```

O texto alternativo pertence a `TextImageSlide`, pois depende do uso
pedagógico. Não serão armazenadas URLs externas arbitrárias.

Abstração prevista:

```text
ObjectStoragePort
  ├─ LocalObjectStorage  obrigatório em desenvolvimento/teste
  └─ S3ObjectStorage     opcional para Cloudflare R2
```

Regras:

- testes nunca acessam serviço cloud;
- arquivos locais versionados são suficientes para concluir o card;
- R2 é implementação opcional e não pode bloquear os critérios de aceite;
- bucket, se usado, deve ser privado ou estritamente controlado;
- a aplicação guarda `objectKey`, não URL permanente do fornecedor;
- credenciais nunca são entregues ao frontend ou versionadas;
- não haverá upload de imagens neste card.

### 6.9 Modelo de progresso

O progresso é hierárquico e contextual:

```text
UserTrailProgress
  └─ UserIslandProgress
       └─ UserLevelProgress
```

Campos essenciais:

```text
UserTrailProgress
  id
  userId
  trailId
  currentTrailIslandId
  createdAt
  updatedAt

UserIslandProgress
  id
  userTrailProgressId
  trailIslandId
  currentIslandLevelId
  createdAt
  updatedAt

UserLevelProgress
  id
  userIslandProgressId
  islandLevelId
  currentLevelSlideId
  completedAt?
  createdAt
  updatedAt
```

Unicidades mínimas:

```text
UNIQUE(userId, trailId)
UNIQUE(userTrailProgressId, trailIslandId)
UNIQUE(userIslandProgressId, islandLevelId)
```

Não serão persistidos:

- percentual;
- estado textual redundante;
- maior slide alcançado;
- revisão de concorrência;
- histórico de visitas;
- conclusão de ilha;
- conclusão de trilha.

### 6.10 Última localização e próxima recomendação

São conceitos distintos:

- `lastVisited` é persistido pelos cursores hierárquicos;
- `nextRecommended` é derivado do primeiro nível iniciado ou disponível ainda
  não concluído.

Antes do primeiro início, `lastVisited` é `null` e `nextRecommended` aponta
para o primeiro slide do primeiro nível. Depois da conclusão de todos os
níveis, `nextRecommended` é `null`.

Exemplo: uma pessoa conclui o nível 1, revisita seu primeiro slide e encerra a
sessão. `lastVisited` aponta para a revisão no nível 1; `nextRecommended` aponta
para o nível 2.

### 6.11 Criação do progresso

- `GET` nunca cria progresso;
- ausência de registro significa não iniciado;
- o progresso nasce em uma ação explícita de navegação para o primeiro slide;
- a mesma transação cria os contextos ausentes de trilha, ilha e nível;
- URL direta para nível bloqueado não cria registros;
- abrir a tela de nível não pode persistir sucesso antes da confirmação do
  comando de navegação.

### 6.12 Estados derivados do nível

```text
completed
  se UserLevelProgress.completedAt estiver preenchido

in_progress
  se existir UserLevelProgress sem completedAt

available
  se não houver progresso e o nível for o primeiro
  ou o posicionamento imediatamente anterior estiver concluído

blocked
  nos demais casos
```

Um nível já concluído permanece concluído e acessível mesmo que uma alteração
estrutural posterior introduza novo predecessor não concluído. Conclusões não
são rebaixadas automaticamente.

### 6.13 Máquina de estados da navegação

Para nível não iniciado:

- somente o primeiro `LevelSlide` é aceito;
- qualquer outro posicionamento produz transição inválida.

Para nível em andamento:

- repetir o slide atual é idempotente;
- avançar é permitido apenas para o posicionamento imediatamente seguinte;
- retornar é permitido apenas para o posicionamento imediatamente anterior;
- saltos produzem transição inválida;
- o cursor representa somente a localização atual;
- voltar descarta qualquer noção de maior avanço.

Para nível concluído:

- qualquer `LevelSlide` pertencente ao nível pode ser aberto para revisão;
- atualizar o cursor não altera `completedAt`;
- conclusão permanece terminal.

O servidor valida em todas as transições:

- pessoa derivada da sessão;
- trilha e ilha corretas;
- pertencimento de `IslandLevel` à composição;
- pertencimento de `LevelSlide` ao `Level` posicionado;
- ordem e liberação;
- existência de todas as relações;
- ausência de campos extras.

### 6.14 Conclusão do nível

- chegar ao último slide não conclui automaticamente;
- o botão “Concluir nível” aparece somente no último slide;
- a API confirma que o cursor atual é o último posicionamento ordenado;
- `completedAt` é preenchido pelo servidor;
- repetir a conclusão retorna sucesso idempotente;
- a repetição não altera a data original;
- não existe contrato de rebaixamento ou exclusão;
- o próximo nível é liberado somente após confirmação da transação;
- falha de persistência nunca é apresentada como sucesso.

### 6.15 Concorrência simplificada

Não haverá `revision` nem `expectedRevision`.

Política:

- comandos executam em transação;
- a raiz do progresso da pessoa é bloqueada enquanto o comando é aplicado;
- restrições únicas impedem contextos duplicados;
- `completedAt` nunca regride;
- a última navegação confirmada define o cursor atual;
- múltiplas abas não recebem mecanismo especial de conflito;
- testes concorrentes verificam integridade e ausência de duplicação, não
  rejeição por versão.

### 6.16 Leitura de conteúdo

`GET` do nível devolve todos os slides ordenados. A API pode derivar
`previousLevelSlideId` e `nextLevelSlideId` para cada posicionamento.

Receber o conteúdo no navegador não significa avançar progresso. A sequência é
garantida pela interface e pelos comandos de cursor. É aceito que uma pessoa
tecnicamente possa inspecionar a resposta HTTP e ler conteúdo futuro; o
conteúdo não é tratado como segredo ou autorização granular.

### 6.17 Contratos HTTP

Rotas mínimas:

```http
GET  /api/learning/islands/island-3
GET  /api/learning/levels/:islandLevelId
GET  /api/progress
PUT  /api/progress/levels/:islandLevelId/current-slide
POST /api/progress/levels/:islandLevelId/complete
```

Entrada de navegação:

```json
{
  "levelSlideId": "uuid-do-posicionamento"
}
```

Entrada de conclusão:

```json
{}
```

Os schemas devem ser estritos e rejeitar `userId`, `completedAt`, `status`,
`position` ou qualquer campo desconhecido.

Cada mutação devolve o snapshot completo e atualizado da trilha. O custo é
pequeno para uma composição de uma ilha, três níveis e nove slides, e isso
elimina atualizações otimistas ou combinação de respostas parciais.

### 6.18 Snapshot canônico

O contrato final deve conter, no mínimo:

- identidade e título da trilha;
- `lastVisited`;
- `nextRecommended`;
- ilhas e níveis ordenados;
- estado derivado de cada nível;
- cursor e `completedAt` quando houver progresso;
- IDs dos posicionamentos usados nas rotas.

Os campos `lastVisited` e `nextRecommended` são anuláveis conforme os estados
inicial e totalmente concluído descritos anteriormente.

Exemplo conceitual:

```json
{
  "trail": {
    "id": "uuid",
    "slug": "codelife",
    "title": "CodeLife"
  },
  "lastVisited": {
    "trailIslandId": "uuid",
    "islandLevelId": "uuid",
    "levelSlideId": "uuid"
  },
  "nextRecommended": {
    "islandLevelId": "uuid",
    "levelSlideId": "uuid"
  },
  "islands": [
    {
      "slug": "island-3",
      "levels": [
        {
          "id": "uuid-do-island-level",
          "availability": "in_progress",
          "progress": {
            "currentLevelSlideId": "uuid",
            "completedAt": null
          }
        }
      ]
    }
  ]
}
```

Schemas reais devem ser estritos e não precisam reproduzir exatamente os
nomes do exemplo se houver justificativa de coerência arquitetural.

### 6.19 Erros de domínio

O envelope existente permanece. Adicionar códigos estáveis:

```text
LEVEL_BLOCKED                    → 403
INVALID_SLIDE_TRANSITION         → 409
LEVEL_NOT_READY_FOR_COMPLETION   → 409
```

Continuam aplicáveis:

```text
UNAUTHORIZED                     → 401
RESOURCE_NOT_FOUND               → 404
VALIDATION_ERROR                 → 400
INTERNAL_ERROR                   → 500
```

`PROGRESS_VERSION_CONFLICT` não deve existir, pois a revisão foi removida.

`ApiClientError` precisa preservar:

- `status`;
- `code`;
- `message`;
- `details`;
- `requestId`.

O frontend decide comportamento por `code`, nunca comparando texto de mensagem.

### 6.20 Autenticação, autorização e CSRF

Preservar a fundação:

- cookie HTTP-only;
- JWT com issuer, audience e algoritmo fixados;
- usuário carregado pelo `sub` da sessão;
- guard global de autenticação;
- `SameSite` e `Secure` configuráveis;
- CORS para uma origem explícita;
- validação estrita de `Origin` em mutações autenticadas;
- nenhum token ou identificador de usuário aceito no payload.

Não adicionar token CSRF separado neste recorte. Testes devem cobrir mutação
sem origem, origem incorreta e sessão ausente.

### 6.21 Identidades de teste

- a interface expõe somente `aluna.demo`;
- não haverá seletor ou parâmetro de impersonação;
- testes de integração criam uma segunda pessoa somente no banco isolado;
- helper de teste produz sessão válida para cada identidade;
- isolamento entre pessoas é validado sem ampliar a interface de login.

### 6.22 Reset de progresso

- não existe endpoint ou botão de reset;
- logout não apaga progresso;
- reset pertence exclusivamente à infraestrutura de teste/demonstração;
- comandos destrutivos devem validar de forma rígida o banco efêmero;
- seed não é mecanismo de limpeza.

### 6.23 Seed e migration

Seed:

- cria ou atualiza conteúdo e identidade experimental;
- usa UUIDs determinísticos para a fixture;
- cria exatamente 1 trilha, 1 ilha, 3 níveis e 9 posicionamentos de slide;
- cria os três subtipos de slide esperados;
- valida vínculos, posições, tipos e FKs;
- pode rodar duas vezes sem duplicação;
- não lê, altera, apaga ou exige ausência de progresso.

Migration:

- verifica se o `UserProgress` antigo está vazio;
- interrompe com mensagem explícita se encontrar progresso;
- não apaga progresso antigo silenciosamente;
- não implementa migração histórica;
- cria o novo modelo composicional e de progresso;
- registra constraints e índices;
- permite recriação da fixture pelo seed controlado.

### 6.24 Frontend e experiência

- React Router representa localização;
- TanStack Query representa estado remoto;
- não adicionar Redux ou outra store global;
- servidor é a fonte de verdade;
- navegação é pessimista: persiste antes de alterar a tela;
- botões ficam desabilitados durante mutações;
- falha mantém a pessoa no slide confirmado;
- resposta completa substitui o cache do snapshot;
- nível bloqueado tem rótulo, texto e ícone, não apenas cor;
- foco vai para o título após navegação confirmada;
- mensagens de erro e sucesso usam região acessível;
- controles reais suportam Tab, Enter e espaço;
- não adicionar atalhos globais de setas;
- layout deve funcionar em desktop e mobile.

### 6.25 Rotas e URLs diretas

- rota da ilha mostra os níveis;
- rota de nível sem slide resolve o cursor atual ou inicia no primeiro;
- em nível em andamento, somente a rota do cursor atual ou uma transição
  adjacente confirmada pode se tornar a rota ativa;
- em nível concluído, qualquer rota de slide pertencente ao nível pode ser
  aberta para revisão;
- rota para nível bloqueado mostra tratamento consistente e não cria progresso;
- salto inválido em nível em andamento redireciona para o cursor confirmado
  após resposta de domínio;
- rota de nível concluído permite qualquer slide;
- URL só muda depois da persistência bem-sucedida;
- recarga e histórico do navegador devem permanecer coerentes.

---

## 7. Macroetapa 1 — Consolidar decisões, contratos e modelo de dados

### 7.1 Objetivo

Estabilizar o contrato técnico e acadêmico antes de implementar comportamento,
substituindo o modelo direto do TCC-14 pela composição reutilizável e preparando
uma fixture íntegra para as etapas seguintes.

### 7.2 Pré-condições

- branch de trabalho não pode ser `main`;
- worktree deve ser inspecionada e alterações existentes preservadas;
- decisões deste roadmap devem ser tratadas como fonte aprovada;
- atualização externa no Jira exige autorização explícita;
- não iniciar frontend ou endpoints de progresso antes de estabilizar schema e
  contratos.

### 7.3 Tarefas

#### A. Alinhar documentação decisória

1. Registrar quais trechos do TCC-11 foram alterados.
2. Atualizar ADR 0003 ou marcá-lo como substituído.
3. Criar ADR para:
   - trilha singleton explícita;
   - entidades atômicas e posicionamentos;
   - progresso contextual com cursor de slide;
   - ausência de revisão e maior avanço;
   - política de edição sem invalidação automática.
4. Atualizar `docs/current/README.md` com as novas fronteiras.
5. Preparar a redação revisada do TCC-15 e seus critérios de aceite.
6. Registrar que a persistência por slide é adaptação deliberada.

#### B. Redesenhar o Prisma schema

1. Introduzir `Trail` e `TrailIsland`.
2. Separar `Island` e `IslandLevel`.
3. Separar `Level` e `LevelSlide`.
4. Manter `Slide` como base atômica.
5. Criar os três modelos de subtipo um-para-um.
6. Criar `MediaAsset`.
7. Criar `UserTrailProgress`.
8. Criar `UserIslandProgress`.
9. Redefinir `UserLevelProgress`.
10. Aplicar UUIDs, timestamps, FKs `RESTRICT`, índices e unicidades.
11. Adicionar checks SQL para posições positivas quando o Prisma não expressar
    a constraint diretamente.
12. Evitar cascatas que apaguem progresso ou conteúdo silenciosamente.

#### C. Criar a migration

1. Adicionar precondição explícita para `UserProgress` antigo vazio.
2. Fazer a migration falhar se a precondição não for atendida.
3. Não migrar ou apagar progresso histórico.
4. Criar as novas tabelas e constraints.
5. Revisar o SQL gerado integralmente.
6. Validar upgrade sobre um banco TCC-14 previamente semeado e sem progresso.
7. Validar migration em banco completamente novo.

#### D. Reescrever o seed

1. Definir UUIDs determinísticos da fixture.
2. Semear uma trilha singleton.
3. Posicionar `island-3` na trilha.
4. Criar três níveis atômicos e seus posicionamentos.
5. Criar nove slides atômicos e nove `LevelSlide`.
6. Distribuir `TextText`, `TextImage` e `TextCode` conforme o protocolo
   experimental aprovado.
7. Criar ativos locais para `TextImage`.
8. Validar exatamente `1 × 1 × 3 × 9` na composição.
9. Remover do seed a exigência de zero progresso.
10. Executar o seed duas vezes e provar idempotência.

#### E. Atualizar contratos compartilhados

1. Criar schemas UUID estritos para posicionamentos.
2. Modelar a união discriminada dos três slides.
3. Adicionar `in_progress` à disponibilidade.
4. Definir summaries de trilha, ilha, nível e slide.
5. Definir snapshot de progresso.
6. Definir entrada estrita de navegação.
7. Definir entrada vazia e estrita de conclusão.
8. Adicionar os novos códigos de domínio.
9. Remover contratos provisórios incompatíveis.
10. Garantir que contratos não exportem modelos Prisma.

#### F. Preparar storage local

1. Definir `ObjectStoragePort` somente se houver consumidor real nesta etapa ou
   na Macroetapa 2.
2. Implementar adaptador local mínimo.
3. Versionar ativos da fixture.
4. Validar tipo MIME e objeto conhecido.
5. Manter R2 como adaptador opcional, sem bloquear a entrega.

### 7.4 Testes da macroetapa

- parsing válido e inválido de todos os schemas;
- união discriminada dos três tipos;
- rejeição de campos extras;
- migration em banco novo;
- migration sobre fundação TCC-14 sem progresso;
- falha da migration quando existir progresso antigo;
- seed executado duas vezes;
- integridade das posições;
- integridade das associações;
- exatamente um subtipo por slide da fixture;
- exatamente uma trilha, uma ilha, três níveis e nove posicionamentos;
- seed preserva progresso criado posteriormente em teste específico;
- ativos referenciados existem no adaptador local.

### 7.5 Critérios de aceite

- [x] Documentos decisórios não contradizem o novo cursor por slide.
- [x] ADR antigo foi alinhado ou explicitamente substituído.
- [x] Prisma Client gera sem erro.
- [x] Migration funciona em banco novo.
- [x] Upgrade controlado da fundação funciona sem perda silenciosa.
- [x] Progresso antigo provoca falha explícita.
- [x] Seed é idempotente e não destrutivo.
- [x] Fixture possui composição exata e ordenada.
- [x] Subtipos relacionais estão íntegros.
- [x] Contratos compartilhados compilam e possuem testes.
- [x] `pnpm check` permanece aprovado.

### 7.6 Arquivos prováveis

```text
apps/api/prisma/schema/
apps/api/prisma/migrations/*
apps/api/prisma/seed.ts
apps/api/prisma/seed.spec.ts
packages/contracts/src/learning.ts
packages/contracts/src/progress.ts
packages/contracts/src/errors.ts
packages/contracts/src/index.ts
apps/web/public/* ou diretório controlado equivalente
docs/adr/*
docs/current/README.md
docs/decisao-recorte-experimental-codelife-tcc-11.md
```

### 7.7 Riscos da macroetapa

- aumento de escopo em relação ao TCC-11 original;
- migration destrutiva se a precondição for implementada incorretamente;
- subtipo divergente da base;
- fixture usar conteúdo diferente da linha de base sem registro;
- UUIDs não determinísticos quebrarem idempotência;
- storage opcional virar dependência obrigatória.

### 7.8 Condição de encerramento

Encerrar quando o modelo puder ser migrado e semeado de forma repetível, os
contratos estiverem estáveis e toda contradição documental relevante estiver
registrada. Não avançar com APIs sobre um schema ainda provisório.

### 7.9 Prompt de retomada sugerido

> Leia `docs/roadmap-implementacao-tcc-15.md` integralmente e execute somente a
> Macroetapa 1. Alinhe as decisões, modele a composição reutilizável, crie a
> migration protegida, reescreva o seed não destrutivo e estabilize os contratos
> Zod. Não implemente ainda a jornada no frontend nem os endpoints completos de
> progresso. Preserve alterações existentes e não faça commit, push ou PR sem
> solicitação explícita.

### 7.10 Registro de execução

**Status:** concluída em 20 de agosto de 2026.

- Implementação: schema composicional com UUIDs e posições, migration protegida,
  seed determinístico e não destrutivo, assets locais, contratos Zod estritos e
  documentação decisória alinhada.
- Validações: `pnpm check`, `pnpm test:api:cov` (linhas da API: 94,19%) e
  `pnpm verify`.
- `pnpm verify` validou migration em banco novo, seed duplo, upgrade controlado
  da fundação TCC-14 sem progresso, bloqueio explícito com `UserProgress`
  legado, checks de posição, unicidade de ordenação, testes de integração e E2E
  fundacional em PostgreSQL efêmero.

---

## 8. Macroetapa 2 — Implementar API, persistência e regras de domínio

### 8.1 Objetivo

Entregar a fonte de verdade da jornada no servidor: leitura ordenada,
disponibilidade, criação contextual de progresso, navegação sequencial,
conclusão idempotente e isolamento entre pessoas.

### 8.2 Organização recomendada

Manter `LearningModule` como fronteira Nest e organizar por capacidade:

```text
apps/api/src/learning/
  trail/
  islands/
  levels/
  progress/
```

Cada feature deve manter próximos:

- controller;
- service;
- repository port;
- repository Prisma;
- testes unitários;
- testes de integração quando aplicáveis.

Não criar camadas globais de controllers/services/repositories e não promover
cada pasta a módulo Nest sem necessidade de imports ou ciclo de vida próprio.

### 8.3 Tarefas

#### A. Leitura da composição

1. Adaptar `IslandsRepositoryPort` ao novo modelo.
2. Consultar `island-3` dentro da trilha singleton.
3. Ordenar `TrailIsland`, `IslandLevel` e `LevelSlide` no banco.
4. Implementar leitura de nível pelo UUID de `IslandLevel`.
5. Carregar `Slide` e exatamente um subtipo.
6. Resolver `MediaAsset` pelo storage controlado.
7. Derivar anterior e próximo a partir da posição.
8. Falhar de forma segura diante de composição inconsistente.

#### B. Read model de progresso

1. Criar `ProgressRepositoryPort`.
2. Implementar `PrismaProgressRepository`.
3. Carregar progresso da pessoa autenticada.
4. Derivar os quatro estados dos níveis.
5. Derivar `lastVisited`.
6. Derivar `nextRecommended`.
7. Montar o snapshot canônico.
8. Usar o mesmo mapper em `GET /progress` e nas respostas das mutações.

#### C. Navegação transacional

1. Implementar `PUT current-slide`.
2. Validar payload com Zod estrito.
3. Derivar pessoa exclusivamente da sessão.
4. Validar `IslandLevel` e `LevelSlide`.
5. Validar pertencimento e trilha singleton.
6. Validar estado bloqueado.
7. Criar contextos ausentes somente ao iniciar no primeiro slide.
8. Bloquear a raiz de progresso dentro da transação.
9. Aplicar a máquina de estados adjacente.
10. Atualizar cursores de trilha, ilha e nível atomicamente.
11. Tratar repetição do cursor atual como sucesso idempotente.
12. Devolver o snapshot completo confirmado.

#### D. Conclusão transacional

1. Implementar `POST complete`.
2. Validar corpo vazio estrito.
3. Confirmar nível existente e acessível.
4. Confirmar cursor no último `LevelSlide`.
5. Preencher `completedAt` no servidor.
6. Preservar a data original em repetição.
7. Não permitir rebaixamento.
8. Recalcular liberação do próximo nível.
9. Devolver snapshot completo.

#### E. Erros e observabilidade

1. Adicionar códigos de domínio ao envelope.
2. Mapear bloqueio para `403`.
3. Mapear transição e conclusão inválidas para `409`.
4. Preservar `requestId`.
5. Não registrar cookie, JWT, conteúdo sensível ou stack na resposta.
6. Garantir que falha do Prisma resulte em erro, nunca sucesso parcial.
7. Manter logs estruturados suficientes para diagnóstico.

#### F. Segurança

1. Confirmar guards globais em todas as novas rotas.
2. Testar `401` sem sessão.
3. Testar `403` sem origem em mutação autenticada.
4. Rejeitar `userId` e campos extras.
5. Validar que uma sessão nunca consulta progresso de outra pessoa.
6. Não adicionar seleção de identidade ao login experimental.

### 8.4 Testes unitários obrigatórios

- primeiro nível disponível;
- nível seguinte bloqueado sem conclusão anterior;
- nível seguinte liberado após conclusão;
- estados `available`, `in_progress`, `blocked` e `completed`;
- cálculo de `lastVisited`;
- cálculo de `nextRecommended`;
- início somente no primeiro slide;
- repetição do slide atual;
- avanço adjacente;
- retorno adjacente;
- rejeição de salto;
- qualquer slide permitido após conclusão;
- conclusão somente no último slide;
- conclusão idempotente;
- conclusão não regride;
- falha de repository propagada como falha;
- mapeamento dos três subtipos;
- inconsistência de subtipo rejeitada;
- payloads estritos.

### 8.5 Testes de integração obrigatórios

- `401` em todas as rotas protegidas sem sessão;
- `403` em mutações autenticadas sem origem válida;
- leitura retorna uma trilha, uma ilha, três níveis e nove slides;
- ordenação determinística em todas as associações;
- nível bloqueado não pode ser iniciado;
- nível inexistente retorna `404`;
- `LevelSlide` inexistente retorna `404`;
- posicionamento pertencente a outro nível é rejeitado;
- nível fora da ilha experimental é rejeitado;
- primeiro comando cria os três contextos de progresso;
- GET não cria progresso;
- cursor sobrevive a nova instância da aplicação;
- salto de slide retorna `409 INVALID_SLIDE_TRANSITION`;
- conclusão antes do último slide retorna
  `409 LEVEL_NOT_READY_FOR_COMPLETION`;
- conclusão cria um único registro;
- conclusão repetida preserva `completedAt`;
- próximo nível é liberado;
- nível concluído permite revisão;
- segunda pessoa possui progresso independente;
- `userId`, `completedAt`, `status` e campos extras são rejeitados;
- falha de persistência não retorna sucesso;
- comandos concorrentes não criam contextos duplicados e mantêm FKs válidas;
- seed executado após progresso não altera a jornada.

### 8.6 Critérios de aceite

- [ ] Controllers apenas adaptam HTTP e delegam regras.
- [ ] Services dependem de ports, não de Prisma concreto.
- [ ] Repositories possuem testes unitários e de integração.
- [ ] Todas as rotas são autenticadas.
- [ ] Nenhum payload aceita identidade editável.
- [ ] Disponibilidade é calculada pelo servidor.
- [ ] Navegação segue a máquina de estados aprovada.
- [ ] Cursores hierárquicos são atualizados atomicamente.
- [ ] Conclusão é explícita, idempotente e terminal.
- [ ] Snapshot completo é retornado por mutações.
- [ ] Erros possuem status e código estáveis.
- [ ] Testes unitários e de integração passam.
- [ ] Cobertura permanece acima do gate do ADR 0006.
- [ ] `pnpm check` passa.

### 8.7 Arquivos prováveis

```text
apps/api/src/learning/learning.module.ts
apps/api/src/learning/islands/*
apps/api/src/learning/levels/*
apps/api/src/learning/progress/*
apps/api/src/learning/trail/*
apps/api/src/common/http/*
packages/contracts/src/learning.ts
packages/contracts/src/progress.ts
packages/contracts/src/errors.ts
apps/api/test/*
```

### 8.8 Riscos da macroetapa

- regra de domínio escapar para controller ou frontend;
- transação criar contextos parciais;
- ausência de lock permitir corrida de inicialização;
- repository devolver modelos Prisma ao contrato público;
- `404` e `403` revelarem ou confundirem pertencimento;
- resposta completa divergir entre GET e mutações;
- storage externo contaminar testes.

### 8.9 Condição de encerramento

Encerrar quando a jornada puder ser executada integralmente pela API, incluindo
login, navegação dos nove slides, conclusão dos três níveis, retomada e
isolamento entre pessoas, com banco PostgreSQL real nos testes de integração.

### 8.10 Prompt de retomada sugerido

> Leia `docs/roadmap-implementacao-tcc-15.md` integralmente e execute somente a
> Macroetapa 2. Implemente leitura, snapshot e comandos de progresso seguindo
> controller → service → repository port → Prisma repository. Cubra regras,
> autorização, transações e erros com testes unitários e de integração. Não
> implemente ainda a experiência completa do frontend. Não faça commit, push ou
> PR sem solicitação explícita.

---

## 9. Macroetapa 3 — Implementar a jornada completa no frontend

### 9.1 Objetivo

Substituir a tela fundacional por uma experiência navegável e acessível que
consuma os contratos confirmados pelo servidor sem duplicar regras de domínio.

### 9.2 Organização recomendada

```text
apps/web/src/
  app/
    router/
    layouts/
  modules/learning/
  features/learning/
  features/progress/
  features/auth/
  api/
  shared/
```

Evitar uma reorganização global sem necessidade. Mover arquivos existentes
somente quando isso aumentar a coesão da jornada e mantiver o diff revisável.

### 9.3 Tarefas

#### A. Roteamento e shell autenticado

1. Integrar React Router ao ponto de entrada.
2. Criar rota da ilha.
3. Criar rota de nível.
4. Criar rota de slide com UUID e slug decorativo.
5. Preservar login experimental e verificação de sessão.
6. Redirecionar sessão ausente para entrada consistente.
7. Tratar slug divergente sem perder o recurso identificado pelo UUID.

#### B. Cliente de API e cache

1. Estender `ApiClientError` com código, detalhes e request ID.
2. Validar toda resposta com Zod.
3. Criar funções de leitura da ilha, nível e progresso.
4. Criar mutações de navegação e conclusão.
5. Usar query keys estáveis.
6. Substituir o cache pelo snapshot devolvido pela mutação.
7. Não aplicar atualização otimista.
8. Não adicionar store global.

#### C. Página da ilha

1. Exibir os três níveis ordenados.
2. Representar os quatro estados.
3. Mostrar texto e ícone de bloqueio/conclusão.
4. Exibir ação “Iniciar”, “Continuar” ou “Revisitar”.
5. Mostrar `nextRecommended` sem substituir `lastVisited`.
6. Tratar loading, erro, vazio e sessão ausente.
7. Não liberar visualmente nível bloqueado.

#### D. Leitor de nível

1. Carregar conteúdo completo do nível.
2. Resolver rota sem slide para cursor atual ou primeiro slide.
3. Renderizar apenas o slide correspondente à rota confirmada.
4. Exibir posição “N de 3”.
5. Exibir botões anterior e próximo.
6. Persistir antes de navegar.
7. Desabilitar controles durante a mutação.
8. Manter slide atual quando houver falha.
9. Mostrar conclusão somente no último slide.
10. Confirmar conclusão antes de atualizar a ilha.
11. Permitir revisão de nível concluído.

#### E. Renderizadores polimórficos

1. Criar mapa fechado por `type`.
2. Implementar `TextText` em duas áreas textuais.
3. Implementar `TextImage` com ativo controlado e alt obrigatório.
4. Implementar `TextCode` com `<pre><code>` ou componente somente leitura.
5. Não usar `dangerouslySetInnerHTML`.
6. Não executar código.
7. Não carregar iframe ou domínio não controlado.
8. Falhar de forma compreensível para tipo desconhecido, embora o contrato
   deva rejeitá-lo antes.

#### F. URLs diretas e erros de domínio

1. Tratar `LEVEL_BLOCKED` com tela ou redirecionamento consistente.
2. Tratar `INVALID_SLIDE_TRANSITION` voltando ao cursor confirmado.
3. Tratar `LEVEL_NOT_READY_FOR_COMPLETION` junto ao botão.
4. Tratar `UNAUTHORIZED` voltando à entrada.
5. Mostrar request ID em detalhe de suporte quando útil.
6. Não inferir comportamento por mensagem textual.

#### G. Acessibilidade e responsividade

1. Usar botões e links semânticos.
2. Garantir foco visível.
3. Mover foco para o título após troca confirmada.
4. Usar região `aria-live` para confirmação e erro.
5. Associar mensagens às ações.
6. Não depender somente de cor.
7. Validar teclado por Tab, Enter e espaço.
8. Não criar atalhos globais de setas.
9. Validar viewport desktop e móvel.
10. Proteger conclusão contra clique duplicado.

### 9.4 Testes unitários/componentes

- parsing de respostas de API;
- `ApiClientError` preserva campos;
- cartões dos quatro estados;
- ação correta por disponibilidade;
- renderização de cada subtipo;
- ausência de HTML executável;
- botões anterior/próximo nas bordas;
- botão concluir somente no último slide;
- estado pending bloqueia clique duplicado;
- erro de navegação mantém slide confirmado;
- erro de conclusão não exibe sucesso;
- tratamento dos códigos de domínio;
- foco e rótulos principais;
- slug não participa da identidade.

### 9.5 Critérios de aceite

- [ ] React Router controla as páginas reais.
- [ ] Cada slide possui URL própria.
- [ ] TanStack Query é a única fonte de estado remoto.
- [ ] Respostas são validadas por Zod.
- [ ] Navegação visual ocorre somente após persistência.
- [ ] Os quatro estados são claros e acessíveis.
- [ ] Os três tipos de slide são renderizados com segurança.
- [ ] URL direta de nível bloqueado é tratada.
- [ ] Recarga preserva localização.
- [ ] Logout/login recupera progresso.
- [ ] Conclusão falha não produz sucesso visual.
- [ ] Desktop e mobile são utilizáveis.
- [ ] Testes de componentes passam.
- [ ] `pnpm check` passa.

### 9.6 Arquivos prováveis

```text
apps/web/src/main.tsx
apps/web/src/app/App.tsx
apps/web/src/app/router/*
apps/web/src/modules/learning/*
apps/web/src/features/learning/*
apps/web/src/features/progress/*
apps/web/src/api/client.ts
apps/web/src/api/learning.ts
apps/web/src/api/progress.ts
apps/web/src/app/styles.css
apps/web/src/test/*
```

### 9.7 Riscos da macroetapa

- duplicar regra de disponibilidade no frontend;
- mudar URL antes da confirmação;
- cache de ilha e progresso divergir;
- slug ser usado como identidade;
- tratamento de erro esconder falha real;
- layout acessível depender de testes manuais tardios;
- componentes tentarem reproduzir HTML do legado.

### 9.8 Condição de encerramento

Encerrar quando uma pessoa conseguir executar a jornada completa no navegador,
com persistência confirmada em cada passo, estados acessíveis e todos os erros
principais tratados, mesmo antes do fechamento formal das evidências E2E.

### 9.9 Prompt de retomada sugerido

> Leia `docs/roadmap-implementacao-tcc-15.md` integralmente e execute somente a
> Macroetapa 3. Integre React Router, implemente ilha, leitor, renderizadores e
> mutações pessimistas usando TanStack Query e os contratos existentes. Cubra
> estados, erros e acessibilidade com testes de componentes. Não altere regras
> de domínio no frontend e não faça commit, push ou PR sem solicitação explícita.

---

## 10. Macroetapa 4 — Fechar testes, evidências e validação humana

### 10.1 Objetivo

Transformar a jornada implementada em uma entrega verificável e auditável,
com isolamento de banco, E2E determinístico, documentação, rastreabilidade e
roteiro humano.

### 10.2 Tarefas

#### A. Isolamento das suítes

1. Preservar PostgreSQL efêmero criado por `verify`.
2. Executar migration e seed para integração.
3. Rodar testes de integração em estado conhecido.
4. Reconstruir logicamente o banco antes do E2E.
5. Executar novamente migration e seed.
6. Subir API e web somente depois do segundo seed.
7. Manter validação rígida da URL antes de qualquer reset.
8. Destruir containers, rede e volume ao final.
9. Nunca limpar o banco de desenvolvimento.

Fluxo-alvo:

```text
PostgreSQL efêmero
  → migration + seed
  → integração
  → reset validado
  → migration + seed
  → API + web
  → Playwright
  → remoção do ambiente efêmero
```

#### B. E2E Playwright

Implementar uma jornada determinística:

1. iniciar sessão experimental;
2. abrir `island-3`;
3. confirmar nível 1 disponível e níveis 2/3 bloqueados;
4. tentar nível 2 por URL direta e observar bloqueio;
5. iniciar nível 1 no slide 1;
6. avançar para slide 2 e recarregar a página;
7. confirmar retomada no slide 2;
8. avançar ao slide 3;
9. concluir explicitamente o nível;
10. confirmar nível 2 liberado;
11. repetir até o nível 3;
12. revisitar slide de nível concluído;
13. encerrar a sessão;
14. iniciar nova sessão;
15. confirmar os três níveis concluídos;
16. confirmar última localização e próxima recomendação coerentes;
17. confirmar no banco que não há registros duplicados.

Adicionar cenário móvel ou projeto Playwright adicional apenas se houver valor
e estabilidade; responsividade também pode ser validada por screenshot/manual.

#### C. Gates automatizados

Executar e registrar:

```text
pnpm check
pnpm test:api:cov
pnpm verify
pnpm audit
```

Confirmar individualmente:

- lint;
- typecheck;
- unitários;
- integração;
- cobertura mínima de 80%;
- build API;
- build web;
- E2E;
- migration em banco limpo;
- seed duplo;
- limpeza do ambiente efêmero.

#### D. Matriz de rastreabilidade

Criar ou atualizar uma matriz contendo:

```text
decisão/requisito
  → regra/invariante
    → teste
      → arquivo
        → evidência
```

Mapear pelo menos:

- hierarquia e ordenação;
- autenticação;
- isolamento de pessoa;
- estados do nível;
- navegação sequencial;
- persistência do cursor;
- conclusão explícita;
- idempotência;
- não regressão;
- revisão de concluído;
- renderização segura;
- seed e banco isolado;
- estados de interface;
- acessibilidade principal.

Revisar IDs R11-A-02, R11-A-03 e R11-A-04, pois sua redação antiga foi
substituída. Novos IDs devem deixar claro o que é preservação e o que é
adaptação.

#### E. Documentação técnica

Versionar:

- endpoints e exemplos de payload/resposta;
- códigos de erro;
- diagrama ou descrição do modelo composicional;
- máquina de estados da navegação;
- política de edição e progresso;
- comandos e versões usados;
- configuração local;
- storage local e configuração opcional de R2;
- procedimento seguro de reset experimental;
- matriz requisito → teste → arquivo;
- resultados dos testes;
- limitações e riscos residuais;
- diferenças em relação ao TCC-11 e ao plano original;
- ausência de dependência cloud nos gates.

#### F. Evidências visuais

Registrar, se útil:

- ilha com estados iniciais;
- acesso direto bloqueado;
- leitor nos três tipos;
- nível em andamento;
- conclusão confirmada;
- próximo nível liberado;
- estado recuperado após nova sessão;
- viewport móvel.

Capturas devem evitar cookies, tokens, variáveis secretas, dados pessoais ou
logs sensíveis.

#### G. Roteiro humano de até dez minutos

1. executar comandos documentados de ambiente;
2. iniciar sessão experimental;
3. abrir `island-3`;
4. tentar nível 2 diretamente e observar bloqueio;
5. iniciar nível 1 e navegar até o segundo slide;
6. recarregar e confirmar retomada;
7. concluir o nível e observar liberação;
8. concluir os demais níveis;
9. sair e entrar novamente;
10. confirmar progresso, revisão e mensagens da interface.

“Revisão” no item 10 significa revisitar nível concluído, não controle de
versão de progresso.

### 10.3 Critérios finais de aceite

- [ ] Jornada completa funciona no mesmo estado versionado.
- [ ] Composição contém exatamente 1 trilha, 1 ilha, 3 níveis e 9 slides.
- [ ] Ordem é determinística.
- [ ] `TextText`, `TextImage` e `TextCode` são seguros e reconhecíveis.
- [ ] Todas as rotas da fatia exigem autenticação.
- [ ] Mutações exigem origem autorizada.
- [ ] Primeiro nível começa disponível.
- [ ] Níveis seguintes começam bloqueados.
- [ ] Nível iniciado passa a `in_progress`.
- [ ] Cursor sobrevive a recarga e nova sessão.
- [ ] Saltos inválidos são rejeitados.
- [ ] Acesso direto a nível bloqueado é tratado.
- [ ] Conclusão exige último slide e ação explícita.
- [ ] Persistência é confirmada antes do feedback de sucesso.
- [ ] Próximo nível só é liberado após conclusão.
- [ ] Conclusão repetida é idempotente.
- [ ] Conclusão nunca regride.
- [ ] Nível concluído pode ser revisitado.
- [ ] Pessoas possuem progresso isolado.
- [ ] Payloads extras são rejeitados.
- [ ] Frontend valida respostas por Zod.
- [ ] Loading, vazio, erro, bloqueio, andamento e conclusão são tratados.
- [ ] Testes unitários, integração e E2E passam.
- [ ] Lint, typecheck e builds passam.
- [ ] Cobertura atende ao gate.
- [ ] Banco de integração não contamina o E2E.
- [ ] Seed é idempotente e não destrutivo.
- [ ] Matriz de rastreabilidade está completa.
- [ ] Roteiro humano foi executado e aprovado.
- [ ] Riscos residuais estão registrados.
- [ ] Nenhum segredo ou dado pessoal foi versionado.

### 10.4 Riscos residuais a registrar

- progresso por slide é adaptação nova, não preservação estrita do legado;
- inspeção da resposta HTTP permite ler slides futuros;
- múltiplas abas usam “última navegação confirmada vence”;
- edição de conteúdo não invalida conclusões;
- alterações estruturais não recalculam progresso histórico;
- integridade exata de subtipo depende do repository e testes, não de trigger;
- R2 é opcional e não participa da validação obrigatória;
- uma trilha singleton não comprova comportamento real de múltiplas trilhas;
- fixture sintética limita generalização dos resultados;
- a contribuição acadêmica continua sendo a metodologia, não a quantidade de
  funcionalidades modernizadas.

### 10.5 Condição de encerramento

O TCC-15 termina quando a jornada vertical estiver executável, testada,
documentada e aprovada manualmente. Resultado tecnicamente inferior em alguma
métrica deve ser preservado como evidência para a avaliação posterior; não deve
provocar expansão automática de escopo.

### 10.6 Prompt de retomada sugerido

> Leia `docs/roadmap-implementacao-tcc-15.md` integralmente e execute somente a
> Macroetapa 4. Isole integração e E2E, conclua Playwright, execute todos os
> gates, produza rastreabilidade, documentação, evidências e roteiro manual.
> Não amplie o produto para corrigir resultados comparativos e não faça commit,
> push ou PR sem solicitação explícita.

---

## 11. Matriz resumida de dependências

| Entrega | Depende de | Bloqueia |
|---|---|---|
| ADRs e contrato revisado | decisões deste roadmap | schema e implementação |
| Schema composicional | contrato revisado | seed, repositories e API |
| Seed novo | schema | integração e E2E |
| Contratos Zod | modelo e endpoints | API e frontend |
| Read model de progresso | repositories e contratos | frontend e mutações |
| Navegação transacional | schema e read model | leitor completo |
| Conclusão transacional | cursor persistido | liberação e E2E |
| Roteamento frontend | contratos estáveis | URLs diretas e E2E |
| Renderizadores | contratos de subtipo | jornada visual |
| Reset entre suítes | seed/migration estáveis | `verify` confiável |
| Matriz de evidência | testes finais | encerramento do card |

---

## 12. Estratégia de revisão por macroetapa

Ao final de cada macroetapa:

1. revisar integralmente o diff;
2. executar `git diff --check`;
3. confirmar que não há alterações de outra macroetapa misturadas sem
   necessidade técnica;
4. executar os gates proporcionais ao risco;
5. registrar testes, resultados e riscos;
6. atualizar checkboxes deste roadmap somente com evidência;
7. não marcar etapa como concluída apenas porque o código compila;
8. não criar commit, push ou PR sem pedido explícito na conversa atual.

Uma macroetapa pode produzir um PR próprio quando o usuário solicitar o fluxo
Git. Caso seja necessário manter a fatia em um único commit final para atender
ao card, os PRs intermediários devem preservar compatibilidade ou permanecer em
sequência claramente dependente.

---

## 13. Definição de pronto global

O trabalho estará pronto quando houver evidência verificável de que:

```text
dados íntegros
  + contratos estáveis
  + regras no servidor
  + interface funcional
  + persistência confirmada
  + autorização
  + testes isolados
  + documentação e evidências
  + validação humana
= fatia vertical concluída
```

Não constituem conclusão isoladamente:

- apenas migration e seed;
- apenas endpoints;
- apenas interface;
- apenas testes unitários;
- apenas uma demonstração sem persistência;
- apenas build bem-sucedido;
- apenas evidência visual;
- apenas implementação cloud opcional.

---

## 14. Decisões explicitamente descartadas

Para evitar reabertura acidental, não adotar sem nova decisão:

- lista ligada persistida entre slides;
- `nextSlideId` como fonte de verdade;
- JSONB como armazenamento dos subtipos;
- herança nativa do PostgreSQL;
- uma tabela concreta isolada por slide sem base comum;
- CUID mais slug duplicados para cada posicionamento;
- slug como autorização ou identidade de nível/slide;
- progresso compartilhado entre reutilizações;
- invalidação automática após edição;
- `furthestLevelSlideId`;
- `revision` e `expectedRevision`;
- event sourcing de visitas;
- sucesso otimista no frontend;
- Redux para o snapshot remoto;
- token CSRF adicional;
- seleção pública da identidade de teste;
- reset de progresso pela API;
- seed destrutivo;
- banco compartilhado entre integração mutável e E2E sem reset;
- dependência obrigatória de R2/S3;
- atalhos globais de teclado;
- conclusão automática ao chegar ao último slide.

---

## 15. Observação acadêmica

A implementação deve ser descrita como aplicação experimental da metodologia
de atualização de sistemas web legados. O CodeLife permanece estudo de caso.

Não afirmar que:

- o novo modelo é universalmente superior;
- o uso de tecnologias atuais prova melhoria por si só;
- o experimento modernizou todo o CodeLife;
- o cursor por slide foi preservado do legado;
- uma fixture sintética valida a metodologia universalmente;
- resultados planejados já foram observados.

Registrar separadamente:

- comportamento preservado;
- adaptação deliberada;
- reforço de segurança/integridade;
- funcionalidade excluída;
- limitação do experimento;
- resultado efetivamente medido.
