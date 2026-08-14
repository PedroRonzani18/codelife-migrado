# Relatório de revalidação do modelo de dados legado — TCC-4

## Objetivo, escopo e evidências

Este relatório confronta o modelo conceitual publicado no TCC (página **Modelo conceitual de entidades** de `TCC/figuras/codelife-diagramas-base.drawio`) com os modelos Sequelize do legado em `codelife/db/`, suas associações e as rotas que usam a persistência. Ele descreve o estado implementado; não propõe schema Prisma, migrations, normalização nem estratégia de dados.

As conclusões se baseiam em `codelife/db/*.js`, `codelife/api/*.js`, pontos relevantes da interface e `README.md`. O arquivo `tools/bootstrap_initial_data.sql` é um artefato de reprodução local e foi usado somente como evidência complementar das constraints que ele tenta criar. Não foi inspecionada uma instância histórica de produção; portanto, uma constraint física adicional naquela instância não pode ser afirmada ou negada por este documento.

| Classificação | Critério |
|---|---|
| **Confirmado** | Conceito e relação principal com evidência direta no modelo e/ou rota. |
| **Parcialmente confirmado** | Existe, mas a granularidade, o alcance ou a integridade diferem. |
| **Divergente** | A relação do modelo conceitual não é persistida dessa maneira. |
| **Descoberto na revalidação** | Estrutura relevante ausente do diagrama conceitual. |

## Visão consolidada da persistência

Há 19 modelos locais e a tabela `users`, provida pelo framework Canon. Todos os modelos locais usam `freezeTableName: true` e `timestamps: false`; o legado não acrescenta automaticamente `createdAt`/`updatedAt`. Fora chaves primárias e `slug` de Projetos/CodeBlocks, os modelos não declaram `allowNull: false`, defaults ou checks de domínio. Assim, `status`, `type`, IDs de referência e ordenação são majoritariamente valores livres cujo sentido depende da aplicação.

```text
users ── 1:1 ── userprofiles ── 1:N ── userprogress
  │                   ├── N:1 schools ── N:1 geos
  │                   ├── 1:N projects (propriedade)
  │                   ├── N:M projects (colaboração), via projects_userprofiles
  │                   └── 1:N codeblocks / threads / comments

islands ── 1:N ── levels ── 1:N ── slides ── 1:N threads ── 1:N comments
  └── codeblocks.lid é referência lógica ao desafio final da ilha

likes e reports ── alvo polimórfico por (type, id)
```

Setas lógicas não são necessariamente FKs físicas. Essa distinção é essencial para a modernização porque vários fluxos pressupõem referências que o banco não protege.

## Entidades relevantes

### Identidade e perfil

| Entidade | Finalidade e campos relevantes | Relações, constraints e observações |
|---|---|---|
| `users` (Canon) | Identidade, credenciais e papel; o código local usa `id`, `username`, `name`, `email` e `role`. | É externo a `db/`. Uma modelagem futura deve definir a fronteira entre identidade/autenticação e domínio CodeLife. |
| `userprofiles` | Perfil CodeLife: `uid`, bio, avatar, gênero, escola/localidade, CPF, respostas JSON, `sharing`, cota de denúncias e idioma. `coins` e `streak` são marcados como depreciados. | `uid` é PK e declara referência a `users.id`, portanto a relação Usuário–Perfil 1:1 é **confirmada**. `sid` e `gid` apontam para escola e localidade. O bootstrap tenta criar somente a FK `userprofiles.uid → users.id`. CPF e respostas de pesquisa exigem classificação de privacidade. |
| `geos` | Localidades: `id`, `id_ibge`, `sumlevel`, `name`. | PK em `id`; referenciada por escola e perfil. Não há unicidade declarada para `id_ibge`. |
| `schools` | Escolas: `id`, `gid`, nome, turmas, idade e matrículas. | `belongsTo geos`; é referenciada por `userprofiles.sid`. O modelo declara as referências; o bootstrap também tenta a FK `schools.gid → geos.id`. |
| `contestentries` | Inscrição de concurso: `uid`, elegibilidade, projeto, data e descrição. O próprio modelo marca o concurso como adiado e `eligible` como legado. | `uid` como PK torna Usuário–Inscrição 1:0..1. `project_id` não tem FK/unique declarada. Tratar como módulo desativado, não núcleo a preservar. |

### Conteúdo pedagógico e progresso

| Entidade | Finalidade e campos relevantes | Relações, constraints e observações |
|---|---|---|
| `islands` | Raiz da trilha: ID, nome, `ordering`, tema, ícone, `is_latest`, desafio final (`prompt`, `initialcontent`, `rulejson`, `cheatsheet`, `victory`) e variantes `pt_*`. | `hasMany levels` por `levels.lid`. PK textual. Não há unicidade de ordenação nem garantia de exatamente uma ilha `is_latest`; o bootstrap só corrige a ausência total de uma ilha marcada. |
| `levels` | Contêiner de slides: ID, nome/descrição, `ordering`, `lid` e variantes PT. | `belongsTo islands` e `hasMany slides`. A associação pede `foreignKeyConstraint: true`, mas o SQL auxiliar não cria essa FK. Não há unique em `(lid, ordering)`. |
| `slides` | Unidade de conteúdo: tipo, título, HTML, `quizjson`, `rulejson`, `mlid`, ordem, variantes PT e `lax`. | `belongsTo levels`; `hasMany threads` por `subject_id`. Quiz/atividade não são tabelas: são JSONs/texto no próprio Slide. Sem unique em `(mlid, ordering)`. |
| `rules` | Templates de mensagens de validação, por tipo e idioma. | É lida/editada por `api/rulesRoute.js`. Qualquer relação com JSONs de regra é lógica; não existe FK a ilhas ou slides. |
| `userprogress` | Conclusão: `uid`, `level`, `gems` depreciado, `datecompleted`, `status`. `level` mistura IDs de níveis e ilhas. | `POST /api/userprogress/save` usa `findOrCreate({ uid, level })` e grava `completed`/`skipped`. Há PK artificial `id`, mas nenhuma FK ou unique em `(uid, level)`. A rota impede rebaixar `completed`, mas não valida existência do ID, pré-requisitos ou enum de status. |
| `glossarywords` | Termos e definições em inglês/português. | Conteúdo global recuperado por rota; não há FK ou associação persistida com Slide. |

### Produções, colaboração e interação social

| Entidade | Finalidade e campos relevantes | Relações, constraints e observações |
|---|---|---|
| `projects` | Produção HTML: `name`, `studentcontent`, dono `uid`, data, `status`, `prompted`, `featured`, `slug`. | Associa usuário/perfil e colaboradores N:M por `projects_userprofiles`; recebe reports. PK e `slug` único. Editar/excluir filtra proprietário, mas adicionar/remover colaborador exige só sessão. |
| `projects_userprofiles` | Vínculo de colaboração: `pid`, `uid`. | A tabela e `belongsToMany` confirmam Projeto–Perfil **N:M**. Não há PK, FKs ou unique `(pid, uid)`; duplicidades e vínculos órfãos são possíveis. |
| `codeblocks` | Código do estudante no desafio final: nome, conteúdo, `previewblob` depreciado, `lid`, `uid`, `status`, `featured`, `slug`. | Associa usuário/perfil; recebe likes e reports. Há PK e `slug` único, mas não unique `(uid, lid)` nem FK para ilha. Embora o comentário declare um CodeBlock por estudante/ilha, é regra não garantida. A criação usa `req.body.uid`, não `req.user.id`. |
| `threads` | Tópico: título, conteúdo, data, `subject_type`, `subject_id`, autor, `status`. | Associa usuário/perfil, slide, comentários, likes e reports. O código declara que o tipo usado atualmente é somente `slide`. `(subject_type, subject_id)` é polimórfico e não tem FK/check. |
| `comments` | Resposta: autor, data, título, conteúdo, `thread_id`, `status`. | É carregada por `threads.hasMany comments` e associa usuário/perfil, likes e reports. Não declara `belongsTo threads`, FK ou cascata; `thread_id` pode ficar órfão. |
| `likes` | Curtidas: autor, `likeid`, `type`. | Pode apontar para CodeBlock, Thread ou Comentário. O próprio modelo alerta para falsos positivos sem filtro por `type`. A rota usa `findOrCreate({ uid, likeid, type })`, mas não há FK/check/unique composto físico. |
| `reports` | Denúncias: autor, motivo, comentário, `report_id`, `type`, `status`, `permalink` depreciado. | Mesmo padrão polimórfico de Likes, para Projeto, CodeBlock, Thread e Comentário. As rotas contam reports novos para ocultar/banir. Não há FKs/checks/unique e alvos excluídos podem ficar sem referência. |

### Estruturas auxiliares ou obsoletas

| Estrutura | Evidência e impacto |
|---|---|
| `searches` | Modelo marcado como não usado; a busca atual consulta usuários/projetos com trigrams. Não deve entrar no recorte sem evidência de uso. |
| `siteconfigs` | Marcado como não usado; configurações foram movidas para variáveis de ambiente. |
| `previewblob`, `coins`, `streak`, `gems`, `eligible`, `permalink` | O código os marca como depreciados, não usados ou incompletos. Não eliminar dados sem inspeção, mas não pressupor requisito vigente. |

## Confronto com o modelo conceitual do TCC

| Relação/conceito do TCC | Classificação | Resultado da revalidação |
|---|---|---|
| Usuário possui Perfil | **Confirmado** | `userprofiles.uid` é PK e referência declarada a `users.id`. |
| Usuário registra Progresso | **Confirmado** | Progresso é recuperado e gravado por usuário, embora sem FK no modelo. |
| Usuário cria/colabora em Projeto | **Confirmado** | Propriedade em `projects.uid`; colaboração N:M em `projects_userprofiles`. |
| Projeto possui CodeBlock | **Divergente** | Não existe `project_id` em `codeblocks` nem associação Projeto–CodeBlock. São produções paralelas: CodeBlock aponta para usuário e ilha. |
| Ilha contém Nível; Nível contém Slide | **Confirmado** | `levels.lid → islands.id` e `slides.mlid → levels.id` aparecem nos modelos e associações. |
| Slide pode conter Quiz/Atividade | **Parcialmente confirmado** | Existem `quizjson` e `rulejson`, mas não entidades/tabelas Quiz ou Atividade. |
| Progresso referencia Slide | **Divergente** | O registro comporta IDs de nível ou ilha; a conclusão do último Slide apenas dispara a gravação do nível. |
| Glossário apoia Slide | **Parcialmente confirmado** | Apoio funcional existe, mas o glossário é global e não possui referência persistida ao Slide. |
| Slide possui Discussão; Discussão contém Thread; Thread contém Comentário | **Parcialmente confirmado** | Há `slides → threads` e `threads → comments`; “Discussão” é composição funcional, não tabela. |
| Discussão em Projetos/CodeBlocks | **Divergente como estado atual** | A estrutura é extensível por tipo, mas comentários no código registram `slide` como único tipo em uso. |

## Regras hoje garantidas apenas pela aplicação

| Regra/risco | Evidência | Implicação para Prisma/PostgreSQL ou equivalente |
|---|---|---|
| Um CodeBlock por usuário e ilha | Intenção em `db/codeBlocks.js`; apenas `slug` é único. | Decidir se preserva a regra e criar unique `(uid, island_id)`. |
| Um progresso por usuário e item | `findOrCreate({ uid, level })`; tabela sem unique composto. | Criar unique após definir uma unidade de progresso inequívoca. |
| `completed` não regride | Condicional em `userprogressRoute`. | Modelar transições de estado no domínio, não só na rota. |
| Tipos/alvos polimórficos válidos | `type` em likes/reports/threads sem check ou FK. | Normalizar relações ou impor enum e validação consistente. |
| Colaborador único e autorizado | Inserção/remoção de pares sem validar proprietário. | Unique `(project_id, user_id)` e autorização no serviço. |
| Trilha e ordenação coerentes | Sem FKs físicas verificáveis e sem unique de ordenação; progresso aceita ID livre. | Criar FKs, unique de ordem e validação de pré-requisitos. |
| Ilha publicada/mais recente | `is_latest` sem índice parcial exclusivo. | Tornar a política de publicação transacional e explícita. |
| Moderação/visibilidade | `status`, `sharing` e limites de report são avaliados nas rotas. | Definir enums, regras de visibilidade e política de moderação no domínio. |

## Dependências por fluxo

| Fluxo | Estruturas envolvidas | Por que não é isolado |
|---|---|---|
| Aprendizagem | Ilhas, níveis, slides, regras, progresso | Conteúdo JSON, ordem, publicação e avanço precisam permanecer coerentes. |
| Desafio final | Ilha, CodeBlock, progresso, perfil | Liga regra de código, referência lógica por ilha, screenshot e conclusão. |
| Projetos colaborativos | Projetos, associação N:M, perfil, reports | Propriedade, autorização, privacidade e moderação atravessam o fluxo. |
| Discussões | Slides, Threads, Comentários, Likes, Reports, perfil | A apresentação depende de polimorfismo, autor e filtros de moderação. |
| Administração de conteúdo | Ilhas, níveis, slides, regras, glossário | O CMS escreve HTML/JSON e ordenações diretamente; mudança de formato exige alteração coordenada. |

## Conclusão

O modelo conceitual do TCC representa corretamente o núcleo do sistema, mas a persistência legada é menos normalizada e menos restritiva do que o diagrama sugere. As diferenças mais importantes são a inexistência de relação Projeto–CodeBlock, o progresso por nível/ilha, as discussões materializadas em Threads polimórficas e a dependência de regras aplicacionais para unicidade, autorização e estados.

Uma modernização não deve migrar somente a tabela do módulo escolhido. Ela precisa incluir identidade, visibilidade, formatos serializados, autorização, integridade referencial e os fluxos adjacentes listados acima. As conclusões são limitadas ao código e aos artefatos locais; um dump ou instância histórica poderá confirmar constraints físicas e qualidade dos dados antes de qualquer migração efetiva.
