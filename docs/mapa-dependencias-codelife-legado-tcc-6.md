# Mapa de dependências do CodeLife legado — TCC-6

**Card:** TCC-6 — Mapear dependências relevantes entre módulos e integrações
**Data da análise:** 14 de agosto de 2026
**Repositório analisado:** ../codelife, commit 9f023a464218155e38de0fa98359236ed062fd5a
**Base documental:** os relatórios TCC-3, TCC-4 e TCC-5 deste repositório.

## Objetivo, escopo e limites

Este documento converte a revalidação de funcionalidades, persistência e regras
de negócio em um mapa para planejar atualização por recorte funcional. Ele
identifica o que cada módulo consome, produz ou compartilha; não seleciona o
recorte final, não define arquitetura alvo e não implementa adapters, mocks,
contratos ou migrações.

A análise é estática e se limita ao commit indicado, complementada pelos testes
históricos com base sintética registrados nos documentos anteriores. Portanto,
uma dependência significa que o código a requer ou referencia; não comprova que
serviços remotos, DNS, credenciais, banco histórico ou portais estejam
operantes atualmente. Uma dependência ausente também não prova inexistência.

| Termo | Significado neste mapa |
| --- | --- |
| **Obrigatória** | Sem ela, o fluxo legado analisado perde pré-condição, dado ou comportamento necessário. |
| **Opcional/substituível** | É usada pelo legado, mas o propósito pode ser mantido por contrato, adaptação ou implementação diferente. |
| **Forte** | A mudança exige tratamento coordenado de formatos, dados, autorização ou estado de mais de um módulo. |
| **Moderada** | Há integração relevante, mas uma fronteira de serviço ou contrato pode isolá-la. |
| **Fraca** | É complementar, histórica ou pode ser postergada sem interromper o núcleo do fluxo. |

Os tipos usados são funcional, dados, API, infraestrutura e interface/estado.
A força indica impacto técnico esperado, não prazo.

## Contexto arquitetural observado

A aplicação combina SPA React, Redux, rotas react-router, APIs do Canon,
modelos Sequelize e PostgreSQL. Na inicialização, App consulta ilhas, níveis e
glossário; autenticação e perfis são providos pelo Canon e modelos associados
(../codelife/app/App.jsx:20-28,94-109; ../codelife/tools/api.js:4-21).

O núcleo didático usa a hierarquia ilha → nível → slide. Quiz, regras e parte
do conteúdo são campos serializados, não módulos de dados independentes
(../codelife/db/islands.js:8-54, db/levels.js:8-36 e db/slides.js:8-48).
O progresso mistura identificadores de nível e ilha; isso liga navegação,
liberação e desafio final a uma semântica que deve ser explicitada antes de
qualquer conversão (db/userprogress.js:1-24; api/userprogressRoute.js:19-68).

## Dependências transversais e entidades compartilhadas

| Recurso compartilhado | Módulos dependentes | Tipo e força | Impacto para a modernização |
| --- | --- | --- | --- |
| Identidade Canon, sessão e papéis | Progresso, perfil, projetos, CodeBlocks, colaboração, discussões, busca e CMS | funcional, dados e API — **forte** | A autorização deve existir no servidor; guardas da interface não substituem essa fronteira. |
| userprofiles | Navegação autenticada, perfil, projetos, CodeBlocks, colaboração, discussões, ranking e moderação | dados e funcional — **forte** | É a ponte de domínio para identidade, privacidade e visibilidade. |
| Ilhas, níveis e slides | Trilha, plano de aula, atividades, progresso, desafio final, discussões e CMS | dados, API e interface/estado — **forte** | Ordem, relações e formatos serializados devem evoluir coordenadamente. |
| rulejson, quizjson, HTML e campos PT | Slides, editor/validação, desafio final e CMS | dados e interface/estado — **forte** | São contratos de conteúdo implícitos; alterar o modelo exige conversão e validação. |
| userprogress | Mapa, página de ilha, slides, CodeBlock final, ranking e continuidade | dados, API e interface/estado — **forte** | Unidade, estados e pré-requisitos não são garantidos integralmente no banco. |
| CodeEditor | Atividades, exemplos, projetos, CodeBlocks e página compartilhada | funcional e interface/estado — **forte** | Separar edição, prévia e execução evita migrar um bloco monolítico. |
| Visibilidade, status, likes e reports | Projetos, CodeBlocks, threads, comentários, cards, perfil e administração | dados, API e funcional — **moderada** | Polimorfismo e moderação são transversais; não assumir FKs ou regras físicas inexistentes. |
| Localidade/idioma e host | App, conteúdo PT/EN, CMS e páginas de conteúdo | infraestrutura, dados e interface/estado — **moderada** | Subdomínio pode ser isolado, mas campos traduzidos permanecem parte dos dados. |
| Arquivos locais | Upload de imagens, avatar, slides e screenshots | infraestrutura — **moderada** | Armazenamento não é regra de domínio, mas é pré-condição da mídia e compartilhamento social atuais. |

## Matriz por módulo e fluxo

| Módulo/fluxo | Dependências obrigatórias observadas | Opcionais ou substituíveis | Entidades e contratos compartilhados | Impacto e possibilidade de isolamento |
| --- | --- | --- | --- | --- |
| Autenticação, perfil e papéis | Canon, sessão, users, userprofiles, papéis 0/1/2 | Login social, recuperação de senha, escola/localidade | uid, username, papel, idioma e visibilidade | **Forte e transversal.** Pode ficar atrás de provedor de identidade se papéis e autorização de domínio forem explícitos. |
| Trilha e leitura de conteúdo | Ilhas, níveis, slides, ordenação, rotas e APIs de conteúdo | Glossário e plano de aula em etapa adjacente | lid, mlid, tipo de slide, HTML e campos PT/EN | **Forte.** Tela de aula isolada não preserva a trilha; leitor de conteúdo pode ser separado se não prometer progresso ou bloqueio. |
| Atividades de quiz e código | Slide, quizjson/rulejson, bloqueio e avanço | Apresentação das mensagens; protocolo legado de execução | Tipo de slide, JSON de regras, unblock e regras de validação | **Forte.** Validação pode mudar, mas a regra de aprovação precisa ser decidida e caracterizada. |
| Progresso e liberação | Sessão, userprogress, ilhas, níveis, mapa e slide | Checkpoint por slide, política de pré-requisitos e semântica de skipped | uid, level, status, datecompleted e is_latest | **Forte.** Tratar junto da trilha autenticada; FKs e unicidade ausentes exigem decisão antes da migração. |
| Desafio final e CodeBlock | Ilha, rulejson, editor, usuário/perfil, CodeBlock e atualização de progresso | Screenshot, destaque, curtidas, denúncias e social | lid, uid, código, status, slug e contrato de aprovação | **Forte.** É extensão da trilha, não CRUD independente: aprovação salva produção e conclui ilha. |
| CMS de conteúdo | Papel administrativo, ilhas, níveis, slides, regras, glossário e upload | Interface do builder e upload atual | Mesmos formatos consumidos pela trilha | **Forte.** Pode vir depois do leitor, mas alteração de schema exige compatibilidade ou conversor. |
| Projetos colaborativos | Sessão, usuário/perfil, projects, associação N:M, autorização e editor | Screenshots, destaque, social e moderação | uid, slug, HTML, visibilidade e projects_userprofiles | **Moderada.** CRUD tem fronteira própria, mas colaboração e autorização não podem ficar somente no cliente. |
| Compartilhamento de produções | Consulta pública por username/slug, perfil compartilhável, projetos ou CodeBlocks | Open Graph, Facebook e screenshots | username, slug, visibilidade e mídia gerada | **Moderada.** URL pode ser isolada; Electron/Xvfb não deve condicionar persistência. |
| Discussões, comentários e moderação | Slides, sessão, perfil, threads, comentários e filtros de status | Likes, denúncias, ranking e filas administrativas | subject_type, subject_id, thread_id, uid e status | **Moderada.** Uso atual é somente para slides; polimorfismo deve ser limitado ou redesenhado com contrato verificável. |
| Busca, perfil público e ranking | Sessão/perfil, projetos, CodeBlocks e pg_trgm | Escola/localidade, ranking e dados não essenciais | username, visibilidade, e-mail e status | **Moderada a fraca.** Pode ser postergado; privacidade deve ser revista antes de manter consultas públicas. |
| Concurso, pesquisa e estruturas históricas | Modelos e telas remanescentes | Todo o módulo é opcional no estado atual | contestentries, searches, siteconfigs e campos depreciados | **Fraca.** Estão desativados, históricos ou sem fluxo ativo confirmado. |

## Relações de dependência relevantes

| Origem | Destino | Tipo | Força | Justificativa observada |
| --- | --- | --- | --- | --- |
| Inicialização da aplicação | Autenticação, ilhas, níveis e glossário | API e interface/estado | forte | App consulta autenticação e carrega os três conjuntos ao montar. |
| Mapa e navegação da trilha | Progresso + hierarquia de conteúdo | funcional, dados e interface/estado | forte | Histórico decide liberação e continuidade; ilhas, níveis e slides dão estrutura pedagógica. |
| Slide | Tipos de conteúdo + quiz/regras + progresso | funcional, dados e interface/estado | forte | Seleciona tipo, bloqueia atividades e grava conclusão do nível. |
| Atividade de código | CodeEditor + regras + sandbox remoto | funcional, API e infraestrutura | forte | Execução JavaScript usa regras serializadas e postMessage com codelife.tech. |
| CodeBlock final | Ilha + CodeEditor + CodeBlock + progresso | funcional, dados e API | forte | Aprovação do desafio salva produção e marca ilha concluída. |
| CMS | Hierarquia + formatos de conteúdo + papéis | dados, API e funcional | forte | Builder cria, edita e remove os mesmos registros e payloads usados pela trilha. |
| Projetos | Identidade/perfil + editor + colaboração + visibilidade | funcional, dados e interface/estado | moderada | Acesso, autoria e colaboradores dependem de usuário/perfil; editor é compartilhado. |
| Discussões | Slide + identidade/perfil + threads/comentários + moderação | funcional, dados e API | moderada | Tipo efetivamente usado é slide; autor e status atravessam apresentação e rotas. |
| Compartilhamento | Projeto/CodeBlock + perfil + slug + mídia | API, infraestrutura e dados | moderada | URLs públicas consultam username/slug; screenshots são gerados assincronamente. |
| Busca | Sessão/perfil + projetos + pg_trgm | API, dados e infraestrutura | moderada | APIs exigem autenticação e a busca depende de extensão PostgreSQL. |

Evidências principais: ../codelife/app/App.jsx:20-28,94-109;
app/pages/Slide.jsx:78-102,180-250,396-401;
app/components/CodeBlockEditor.jsx:94-102,158-186;
app/components/CodeEditor/CodeEditor.jsx:17-20,66-87,448-460;
api/builderRoute.js:19-160; api/projectsRoute.js:71-385; e
api/threadsRoute.js:118-208.

## Integrações e restrições de infraestrutura

| Integração/recurso | Consumidores | Situação e classificação | Possibilidade de isolamento |
| --- | --- | --- | --- |
| Framework Canon | Inicialização, identidade, APIs, build, rotas e modelos | **Obrigatório no legado; forte.** Usuários e autenticação não são modelos locais. | Substituir somente com fronteira explícita para identidade, sessão e papéis. |
| PostgreSQL + Sequelize | Todos os dados de domínio e pg_trgm | **Obrigatório no legado; forte.** Modelos locais e dados Canon compartilham ambiente. | Acesso por repositórios/serviços e migração de constraints após validar dados históricos. |
| Sandbox codelife.tech + postMessage | Execução e prévia de JavaScript | **Obrigatório para execução legada; forte.** Fonte existe, hospedagem atual não foi confirmada. | Adotar sandbox controlado; não preservar domínio, iframe ou protocolo sem decisão de segurança. |
| Electron, Xvfb e filesystem local | Screenshots de projetos/CodeBlocks e mídia | **Obrigatório somente para imagem atual; moderado.** | Substituir por serviço/fila ou postergar imagem social sem bloquear CRUD. |
| Subdomínios PT/EN e DNS/hosts | Idioma, redirecionamento e landing pages do sandbox | **Relevante; moderado.** Lógica existe; DNS não foi observado. | Centralizar locale em aplicação/roteamento e converter campos PT/EN com plano de dados. |
| Upload local de imagens | Perfil e slides | **Relevante; moderado.** Arquivos são referenciados por caminho local. | Adapter de armazenamento e migração de referências, preservando autorização de upload. |
| Mailgun e limiares de denúncia | Moderação/notificação | **Complementar; fraco a moderado.** Não é necessário para trilha ou CRUD básico. | Isolar atrás de evento/notificação após validar política de moderação. |

O README registra Node 10.24.1, PostgreSQL 10, Canon, Electron/Xvfb,
subdomínios e banco local (../codelife/README.md:5-14,26-117,146-180). Essas
restrições explicam risco de reprodução; não prescrevem arquitetura nova.

## Acoplamentos, ciclos e pontos de atenção

Não foi identificada dependência circular de importação que, por si só,
determine o recorte. Há ciclos funcionais e acoplamentos de estado que tornam
arriscadas mudanças parciais:

| Situação | Dependências envolvidas | Consequência para o planejamento |
| --- | --- | --- |
| Ciclo funcional da trilha | Conteúdo → navegação/atividade → progresso → liberação de conteúdo | Modernizar somente visualização pode perder avanço, bloqueio ou continuidade. |
| Ciclo editorial | CMS escreve ilhas/níveis/slides/regras; trilha e editor consomem os mesmos campos | HTML e JSON precisam de contrato, conversão e teste de leitura antes de trocar editor ou schema. |
| Desafio final | Ilha fornece regra; CodeBlock usa editor; aprovação altera progresso; mapa relê progresso | É fatia vertical própria, mas depende do núcleo de aprendizagem. |
| Produções e prévia | Projetos/CodeBlocks reutilizam editor; editor referencia sandbox; compartilhamento gera screenshot | Separar edição, prévia, execução e imagem evita carregar infraestrutura para preservar texto. |
| Autorização distribuída | Guardas de rota, sessão Canon e verificações incompletas nas APIs | Migração deve concentrar regra no backend; manter somente interface reproduz riscos de autoria e colaboração. |
| Relações polimórficas | Threads, likes e reports usam tipo + identificador sem FKs/checks | Migração de discussão/moderação precisa definir alvos válidos, integridade e exclusão. |

Há riscos sem garantia física: userprogress não tem FK ou unicidade composta
para usuário/item; codeblocks não declara unicidade (uid, lid); e a associação
de colaboradores não impõe unicidade ou autorização de proprietário. Eles
justificam análise de risco, não modernização total.

## Fatias verticais possíveis para avaliação posterior

As opções abaixo são candidatas para comparação. Não selecionam o recorte final
nem afirmam viabilidade sem testes de caracterização.

| Fatia candidata | Inclui | Dependências mínimas | Fora inicialmente | Risco e observação |
| --- | --- | --- | --- | --- |
| Leitura estruturada de conteúdo | Ilha → nível → slide, ordenação e tipos não interativos | Conteúdo, rota/API de leitura e idioma | Progresso, autenticação, quiz/código, CMS e glossário | **Médio.** Fronteira simples, mas não preserva aprendizagem autenticada nem avanço. |
| Trilha autenticada com progresso | Leitura, identidade, progresso, liberação e conclusão de nível | Leitura + sessão/perfil + userprogress + política de status/pré-requisito | Sandbox, desafio final, CMS, social e projetos | **Alto.** Coesa para jornada principal, mas depende de resolver semântica ambígua de progresso. |
| Atividade de código | Exercício, regra, feedback e aprovação | Trilha + formato de regra + editor/validação | Domínio/protocolo legado do sandbox; screenshots e social | **Alto.** Separar validação local, prévia e execução segura; falhas históricas impedem assumir bloqueio validado. |
| Desafio final da ilha | CodeBlock aprovado e conclusão de ilha | Trilha + atividade de código + CodeBlock + progresso | Likes, reports, destaque, screenshot e social | **Alto.** Conjunto coeso com ilha e progresso, não com projetos. |
| Administração de conteúdo | Edição de ilhas, níveis, slides, regras e glossário | Papéis + mesma representação de conteúdo da trilha | Builder legado e upload atual | **Alto.** Deve acompanhar ou preceder mudança de schema, mas pode vir depois do leitor. |
| Projeto individual | Criar, editar e recuperar produção própria | Sessão/perfil + projects + autorização + edição | Colaboração, screenshot, redes sociais, ranking e moderação | **Médio.** Editor pode ser reaproveitado ou substituído; persistência e autoria são invariantes a caracterizar. |
| Colaboração em projetos | Acesso de colaborador e gestão N:M | Projeto individual + perfil + associação N:M + autorização no servidor | Social, buscas amplas e ranking | **Alto.** Legado não confirma autoridade para adicionar/remover colaboradores. |
| Discussões de slides | Threads e comentários vinculados a slide | Trilha + sessão/perfil + threads/comentários + política de status | Likes, reports e painel administrativo | **Médio.** Restringir a slide evita assumir suporte atual a projetos e CodeBlocks. |

## Ordem de implementação sugerida como insumo, não decisão

1. Confirmar fronteira de identidade/autorização e semântica de uid, papel,
   visibilidade e idioma.
2. Definir contrato da hierarquia de conteúdo e formatos serializados antes de
   alterar trilha ou CMS.
3. Para aprendizagem, decidir unidade de progresso, estados, pré-requisitos e
   critérios de conclusão; então caracterizar o fluxo ponta a ponta.
4. Tratar execução de código como capacidade separável: regras, prévia e
   sandbox seguro não precisam reproduzir domínio ou protocolo legado.
5. Acrescentar desafio final, CMS, projetos, colaboração e social somente
   quando invariantes e dependências transversais estiverem explicitadas.

Isso reduz o risco de uma mudança visual que preserve telas, mas perca regras,
dados ou autorização. Não determina prioridade acadêmica ou técnica final.

## Rastreabilidade e critérios do card

| Critério de aceite do TCC-6 | Cobertura neste documento |
| --- | --- |
| Dependências principais dos módulos candidatos | Matriz por módulo e relações relevantes. |
| Dependências de dados coerentes com persistência | Entidades transversais, relações, integridade e limites de progresso, CodeBlock, colaboração e polimorfismo. |
| Integrações externas registradas | Tabela de integrações e restrições de infraestrutura. |
| Módulos independentes versus efeito cascata | Classificação de força, acoplamentos e fatias verticais. |
| Subsídio para complexidade e risco | Impacto por módulo, riscos de dados/estado/autorização e ordem sugerida. |
| Isolamento sem exigir modernização total | Dependências opcionais, estratégias de isolamento e exclusões por fatia. |

## Referências de evidência

- docs/inventario-funcional-codelife-legado.md (TCC-3): módulos, rotas, APIs,
  integrações e acoplamentos funcionais.
- docs/relatorio-revalidacao-modelo-dados-legado-tcc-4.md (TCC-4): modelos,
  relações, constraints ausentes e entidades compartilhadas.
- docs/revalidacao-fluxos-regras-negocio-tcc-5.md (TCC-5): invariantes
  candidatas, divergências e limites dos fluxos prioritários.
- Código-fonte do commit indicado em ../codelife/app/, ../codelife/api/,
  ../codelife/db/, ../codelife/sandbox/, ../codelife/tools/ e README.md.

Nenhum arquivo do legado foi alterado. Este mapa deve ser revisado quando houver
nova evidência de execução, dados históricos ou decisão formal sobre o recorte
de modernização.
