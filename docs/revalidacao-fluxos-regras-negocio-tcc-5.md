# Revalidação de fluxos e regras de negócio do CodeLife legado

**Card:** TCC-5 — Revalidar fluxos e regras de negócio do CodeLife
**Data da análise estática:** 14 de agosto de 2026
**Legado analisado:** "../codelife", commit "9f023a464218155e38de0fa98359236ed062fd5a"

## Objetivo e método

Este documento confronta os fluxos prioritários descritos no TCC com a
implementação do CodeLife legado. O objetivo é oferecer evidências para a
definição posterior de invariantes funcionais, separando intenção de negócio,
detalhe técnico, comportamento ambíguo e falha observada.

Foram usados três níveis de evidência:

1. A caracterização e o checklist CF-01 a CF-22 do Capítulo 6 do TCC.
2. Revisão estática de rotas React, componentes, APIs Express e modelos
   Sequelize no commit indicado.
3. Testes manuais com base sintética, já registrados em
   "../codelife/docs/resultados-testes-funcionais-codelife.md", em 14 de junho
   de 2026.

Os testes citados são evidência histórica do ambiente local preparado e não
foram reexecutados neste card. Eles não comprovam operação atual dos portais
ou serviços externos. Da mesma forma, uma rota ou componente encontrado no
código não é tratado como confirmação de fluxo funcional completo.

| Classificação | Critério usado |
| --- | --- |
| **Invariante candidata** | Intenção funcional central descrita no TCC e sustentada pelo código; deve ser confirmada no recorte antes de ser preservada. |
| **Regra técnica** | Decisão de implementação que pode ser substituída sem alterar a finalidade funcional. |
| **Adaptação possível** | Mesmo propósito pode ser preservado com implementação mais robusta ou segura. |
| **Divergência/ambiguidade** | Código, TCC e/ou teste não permitem uma interpretação funcional única; requer decisão explícita. |
| **Fora do recorte potencial** | Capacidade existente que não é necessária aos fluxos prioritários, salvo escolha posterior. |

## Síntese executiva

| Fluxo | Conclusão | Principal decisão pendente |
| --- | --- | --- |
| Aprendizagem | A relação ilha → nível → slide está implementada. | Confirmar bloqueio efetivo por quiz/código; o teste local registrou falha. |
| Código | Editor, regras e canal de retorno existem. | Separar validação funcional de dependência do sandbox remoto. |
| Progresso | Conclusão e "skipped" são persistidos. | Definir significado de "skipped" e granularidade de progresso. |
| Produções | CRUD e leitura compartilhável existem no código. | Reproduzir falhas de edição, codeblock e URL pública observadas localmente. |
| Colaboração | Colaboradores e discussões em slides existem. | Delimitar o escopo de discussão e reforçar autorização. |

O resultado não altera regras nem corrige o legado. Ele permite escolher um
recorte e formular testes de caracterização antes da modernização.

## F-01 — Navegação e progressão de aprendizagem

**Ator e objetivo.** Estudante autenticado percorre ilhas, níveis e slides de
uma trilha educacional e conclui atividades para avançar.

**Entrada e pré-condições.** As rotas estão em "app/routes.jsx:35-38"; a
trilha depende de conteúdo carregado, sessão e histórico de progresso. As
relações persistentes estão em "db/islands.js", "db/levels.js" e "db/slides.js".

**Sequência implementada.** "Slide" seleciona o tipo de slide, inicia "Quiz" e
"InputCode" bloqueados e libera a próxima navegação por "unblock"
("app/pages/Slide.jsx:78-89,135-166,359-402"). Ao chegar ao último slide, a
tela envia o registro de progresso.

**Estados e dados.** "blocked", "latestSlideCompleted", "skipped" e
"showDiscussion" são estados de interface. A conclusão é enviada a
"/api/userprogress/save".

| Regra/comportamento | Classificação | Evidência e conclusão |
| --- | --- | --- |
| A relação ilha → nível → slide organiza a aprendizagem. | Invariante candidata | Está no TCC (CF-03--CF-05) e nos modelos. A forma de armazenamento pode mudar, mas a relação pedagógica deve ser preservada se o fluxo entrar no recorte. |
| Quiz e atividade de código impedem avanço até aprovação. | Divergência/ambiguidade | O código implementa bloqueio, mas T04 registrou avanço sem resposta e após resposta errada. É intenção candidata, não comportamento comprovado. |
| A conclusão de nível ocorre no último slide. | Invariante candidata | "saveProgress" é acionado no último slide ("Slide.jsx:91-102,161-166"). Deve ser confirmada como regra de domínio; checkpoints podem ser adicionados sem mudar a noção de conclusão. |
| Abrir discussão registra "skipped". | Divergência/ambiguidade | "toggleSkip" associa discussão a "skipped" ("Slide.jsx:230-250"). O significado pedagógico e seu efeito precisam de decisão. |
| Último slide concluído só existe em memória. | Regra técnica | O componente informa que o estado não persiste ao sair da aula ("Slide.jsx:28-35"). Não há motivo funcional demonstrado para repetir essa limitação. |

**Pós-condições.** Um slide não bloqueante ou aprovado habilita a continuação
do percurso; o último slide solicita o registro da conclusão do nível. A
liberação efetiva de ilhas e níveis deve ser retestada porque há evidência de
comportamento inconsistente entre o mapa e o percurso.

**Exceção registrada.** T03 observou a terceira ilha bloqueada no mapa, mas
acessível ao percorrer slides. Essa diferença deve ser tratada como divergência
de regra de acesso/progressão, e não como comportamento automaticamente
preservável.

## F-02 — Escrita, validação e prévia de código

**Ator e objetivo.** Estudante escreve código, recebe retorno de regras e,
quando aplicável, obtém prévia ou execução.

**Entrada e pré-condições.** "InputCode" recebe código inicial e "rulejson" do
slide ("app/components/slidetypes/InputCode.jsx:31-47"). O "CodeEditor" é
reutilizado em atividades, exemplos, projetos e codeblocks. A prévia depende
de iframe e de sandbox externo.

**Sequência implementada.** No envio, "InputCode" chama "isPassing()" e só
chama "unblock" se a resposta passar ("InputCode.jsx:59-75"). "CodeEditor"
escuta "postMessage" e envia sinal de prontidão ao iframe
("app/components/CodeEditor/CodeEditor.jsx:66-87").

| Regra/comportamento | Classificação | Evidência e conclusão |
| --- | --- | --- |
| Código que não atende às regras não libera atividade. | Invariante candidata com falha observada | Essa é a intenção de "InputCode"; T05 registrou sucesso sem o "h1" exigido. A rejeição de código inválido deve ser testada e robustecida, não copiada cegamente. |
| A pessoa recebe mensagens sobre a validação. | Invariante candidata | O TCC prevê CF-12 e o legado possui "DrawerValidation". A apresentação pode mudar, mas retorno compreensível é funcionalmente relevante. |
| Prévia/execução usam "codelife.tech" e "postMessage". | Regra técnica | São detalhes de integração, não regra de domínio. Podem ser substituídos com preservação da capacidade escolhida. |
| Sandbox remoto disponível é requisito para validar todo o fluxo. | Adaptação possível | T06 registrou prévia/sandbox em 404. A intenção de experimentar código não depende necessariamente desse domínio ou protocolo. |
| Atividade de código efetivamente bloqueia avanço. | Divergência/ambiguidade | A intenção do código e T05 divergem. É necessário reproduzir com dados e sandbox controlados antes de declarar preservação. |

**Pós-condições.** Quando a regra é considerada aprovada, a atividade informa
sucesso e solicita o desbloqueio do slide. Quando não é aprovada, deveria
permanecer bloqueada e devolver uma mensagem de erro; o resultado de T05
impede tratar essa pós-condição como validada.

**Exceção relevante.** A falha de prévia ou de sandbox pode impedir a execução
visual sem, por si só, demonstrar que as regras locais de código são inválidas.
O diagnóstico deve registrar qual subetapa falhou: carregamento do editor,
avaliação local, comunicação com o iframe ou execução remota.

O repositório contém páginas em "sandbox/", mas não prova a hospedagem atual
de "codelife.tech"; não se deve inferir indisponibilidade permanente a partir
do 404 observado no ambiente local.

## F-03 — Persistência e recuperação do progresso

**Ator e objetivo.** Estudante registra a conclusão de níveis/ilhas e retoma a
trilha a partir do histórico.

**Entrada e sequência.** Com sessão ativa, "GET /api/userprogress/mine"
recupera registros e "POST /api/userprogress/save" grava itens
("api/userprogressRoute.js:19-68"). A conclusão do último slide usa
"completed"; a abertura de discussão pode usar "skipped". Um CodeBlock final
aprovado grava a ilha em "app/components/CodeBlockEditor.jsx:94-102,158-186".

**Dados alterados.** "userprogress" persiste "uid", "level", "datecompleted"
e "status" ("db/userprogress.js:1-24"). O campo "level" recebe tanto ID de
nível quanto de ilha e não representa o slide atual.

| Regra/comportamento | Classificação | Evidência e conclusão |
| --- | --- | --- |
| Conclusão fica associada ao estudante e à unidade didática. | Invariante candidata | A relação está no modelo e uma gravação foi observada por API na base sintética. O esquema pode mudar. |
| "completed" não é rebaixado por gravação posterior. | Invariante candidata | O endpoint evita esse rebaixamento. Confirmar se reabertura/revisão de conteúdo entra no recorte. |
| "skipped" significa conclusão com ajuda. | Divergência/ambiguidade | Existe no cliente, mas o TCC não define completamente sua semântica ou efeito em liberação. |
| Servidor valida existência do item, pré-requisito e aprovação. | Adaptação possível | A API não confirma esses critérios antes de gravar. Reforçar o backend preserva a finalidade e reduz inconsistências. |
| Persistência apenas no fim de nível. | Regra técnica | A falta de checkpoint por slide decorre do desenho atual e pode ser superada sem mudar o objetivo de acompanhamento. |

**Pós-condições.** Depois de uma gravação aceita, o histórico do estudante
deve conter a unidade e seu estado; uma conclusão já registrada não deve ser
rebaixada pelo endpoint atual. A recuperação desse histórico orienta as telas
de navegação e liberação.

**Exceções relevantes.** O endpoint não valida existência, pré-requisito ou
aprovação antes de aceitar o identificador recebido. Além disso, o mesmo campo
armazena ilhas e níveis; qualquer migração precisa preservar ou redefinir essa
semântica de forma explícita.

## F-04 — Projetos, codeblocks e compartilhamento

**Ator e objetivo.** Estudante cria/edita uma produção, a visualiza e, quando
permitido, obtém um link compartilhável. CodeBlock também pode ser desafio
final de uma ilha.

**Entrada e sequência.** Projetos usam rotas "/projects/..."; sua criação usa
o usuário da sessão ("api/projectsRoute.js:313-330") e a leitura admite dono ou
colaborador (":145-154"). Codeblocks são criados/atualizados por
"/api/codeBlocks/new|update" e podem ser consultados por usuário e slug
("api/codeBlocksRoute.js:109-176,234-251").

**Dados e dependências.** Conteúdo, nome/slug, autoria, visibilidade e
colaboração são persistidos. Captura de tela escreve em disco e depende de
Electron/Xvfb; é infraestrutura, não regra de domínio.

| Regra/comportamento | Classificação | Evidência e conclusão |
| --- | --- | --- |
| Produção pertence ao autor e só pessoa autorizada a altera. | Invariante candidata com risco | Projetos novos usam "req.user.id", mas codeblocks recebem "uid" no corpo ("api/codeBlocksRoute.js:109-110,146-150"). Autoria/autorização deve ser preservada, embora a implementação atual não a garanta. |
| Criar, editar e recuperar projeto preserva conteúdo. | Divergência/ambiguidade | O CRUD existe, mas T08 registrou edição/salvamento sem persistência. Isolar editor, rota e sandbox antes de usar como invariante. |
| CodeBlock final aprovado conclui ilha. | Invariante candidata | Está no componente. Preservar somente se desafio final fizer parte do recorte. |
| Link por usuário e slug compartilha produção. | Invariante candidata com falha observada | Há endpoint público, mas T09 registrou URL pública de codeblock em 404. Especificar e retestar o contrato. |
| Screenshot por Electron/Xvfb em disco local. | Regra técnica | Pode ser substituído ou removido do primeiro recorte sem alterar o CRUD essencial. |
| Há um único CodeBlock por estudante/ilha. | Divergência/ambiguidade | A intenção é sugerida pelo desafio final, mas não há restrição evidente de unicidade "(uid, lid)". Decidir antes de migrar dados. |

**Pós-condições.** Uma operação de criação ou edição bem-sucedida deve deixar
o conteúdo recuperável para o autor e, quando o compartilhamento estiver
habilitado, pelo contrato público de usuário e slug. Um CodeBlock aprovado pode
também produzir atualização de progresso da ilha.

**Exceções relevantes.** T08 não confirmou a persistência da edição de projeto
e T09 observou URL pública de CodeBlock em 404. A captura de tela assíncrona
pode falhar independentemente da gravação da produção e não deve determinar o
resultado do CRUD.

## F-05 — Colaboração, discussões e comentários

**Ator e objetivo.** Proprietário inclui colaboradores em projeto; estudantes
discutem slides por threads e comentários.

**Entrada e sequência.** "addcollab", "removecollab" e "leavecollab" manipulam
a relação de colaboradores ("api/projectsRoute.js:338-360"). "Slide" abre
"Discussion" com "subjectType=slide" e ID do slide
("app/pages/Slide.jsx:396-401"). O modelo declara que o único tipo atual de
discussão é "slide" ("db/threads.js:1-42").

| Regra/comportamento | Classificação | Evidência e conclusão |
| --- | --- | --- |
| Colaborador autorizado pode acessar projeto compartilhado. | Invariante candidata | A leitura confere dono ou colaborador. T10 observou relação/listagem, mas não validou edição completa. |
| Só proprietário administra colaboradores. | Adaptação possível | As rotas exigem sessão, mas não confirmam propriedade. Reforçar autorização preserva a intenção de colaboração. |
| Discussões pertencem a slides. | Invariante candidata | O modelo torna o escopo explícito. Não assumir discussões em projetos/codeblocks como capacidade atual. |
| Abrir discussão equivale a pular conteúdo. | Divergência/ambiguidade | O acoplamento está no cliente, mas sua finalidade pedagógica precisa ser decidida. |
| Curtidas, denúncias, ranking e moderação. | Fora do recorte potencial | São capacidades reais, porém não necessárias aos fluxos priorizados, salvo decisão posterior. |

**Pós-condições.** Incluir ou remover uma colaboração altera a relação entre
usuário e projeto; uma thread ou comentário aceito deve ficar associado ao
slide e disponível na discussão correspondente. O acesso a projeto precisa
permanecer condicionado a autoria ou colaboração autorizada.

**Exceções relevantes.** A criação e remoção de colaboradores não verificam
explicitamente se o solicitante é proprietário. Discussões de projetos e
CodeBlocks não devem ser inferidas do desenho polimórfico, pois o modelo
declara apenas o tipo "slide" como uso atual.

A análise anterior também registrou que a interface envia denúncia de comentário
como "contentType=thread", embora o componente suporte "comment". Isso deve
ser mantido como achado para decisão posterior, sem correção automática neste
card.

## Precisões necessárias no inventário do TCC

| Tema | Evidência revalidada | Precisão para a modernização |
| --- | --- | --- |
| Atividades bloqueantes | Intenção no código; T04/T05 com falhas. | Não marcar bloqueio como plenamente validado. Definir regra esperada e teste de caracterização. |
| Sandbox e execução | Editor e integração existem; T05/T06 falharam. | Separar validação local, prévia e sandbox remoto em subcomportamentos. |
| Progresso | API/tabela persistem conclusão. | Não afirmar checkpoint por slide ou pré-requisito validado no servidor. |
| Projetos/codeblocks | Endpoints e modelos existem; T08/T09 falharam. | Tratar edição e compartilhamento como fluxos a retestar. |
| Discussões/perfis | Threads são de slide; perfil completo exige sessão. | Qualificar "discussões associadas a conteúdo" e "perfis públicos". |

## Dependências e decisões pendentes

1. **Autenticação/autorização:** guardas de interface não substituem validação
   no backend; autoria e colaboração precisam de contrato explícito.
2. **Conteúdo serializado:** quizzes e regras dependem de JSON em slides/ilhas;
   uma modernização precisa prever migração e validação desses formatos.
3. **Sandbox:** é a dependência externa mais sensível. Preservar capacidade não
   exige preservar domínio, iframe ou protocolo legado.
4. **Dados de progresso:** ilhas e níveis compartilham o campo "level"; mapear
   sua semântica é pré-requisito para conversão de dados.
5. **Arquivos/capturas:** screenshots e uploads locais são restrições
   operacionais, não evidência de regra de negócio.

## Resultado para definição de invariantes

Há evidência para iniciar a seleção do recorte, mas não para declarar todos os
fluxos plenamente preservados. Se a intervenção priorizar a trilha, as
invariantes candidatas iniciais são:

1. Manter a relação pedagógica entre ilha, nível e slide.
2. Persistir conclusão de unidades por estudante.
3. Exigir aprovação conforme regra definida antes de liberar atividade.
4. Fornecer retorno compreensível sobre validação de código.
5. Manter autoria e acesso autorizado a produções selecionadas.
6. Preservar o escopo explícito das discussões, se elas integrarem o recorte.

Antes de implementar, é necessário decidir o papel de "skipped", política de
pré-requisitos, granularidade de progresso, unicidade de codeblocks, contrato
de compartilhamento e quais falhas observadas serão tratadas como bugs versus
itens fora do recorte.

## Limites e rastreabilidade

- A árvore de trabalho do legado possui alterações locais não relacionadas a
  este card. A evidência estática foi delimitada ao commit "9f023a4"; nenhum
  arquivo do legado foi modificado.
- A base de testes é sintética e não representa dados ou operação de produção.
- Não foram inferidos disponibilidade atual de serviços externos, usuários ou
  estado operacional do projeto.
- Este card não altera regras, cria fluxos, corrige bugs nem define o recorte
  final da modernização.

Artefatos complementares:

- "docs/inventario-funcional-codelife-legado.md" — módulos e funcionalidades;
- "docs/relatorio-revalidacao-modelo-dados-legado-tcc-4.md" — persistência;
- "../codelife/docs/plano-testes-funcionais-codelife.md" — reprodução;
- "../codelife/docs/resultados-testes-funcionais-codelife.md" — observações;
- "../codelife/docs/diagnostico-base-funcional.md" — base sintética e APIs.
