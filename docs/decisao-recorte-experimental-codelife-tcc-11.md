# Decisão do recorte experimental e dos limites da intervenção — TCC-11

**Card:** TCC-11 — Definir o recorte experimental e os limites da intervenção

**Data da decisão:** 16 de agosto de 2026

**Legado analisado:** `../codelife`, commit
`9f023a464218155e38de0fa98359236ed062fd5a`

**Base da versão modernizada consultada:** `../codelife-migrado`, commit
`748215aecf57318b3135424f813ae29fa3493c84`

**TCC consultado:** `../TCC`, commit
`cfc87f09d20eabcd290e1f988eaaf202c31e12fb`

**Objetivo:** congelar uma intervenção pequena, executável e comparável para a
aplicação experimental da metodologia, definindo o comportamento incluído, as
dependências mínimas, as adaptações permitidas, as exclusões e a condição de
encerramento da implementação.

## Decisão executiva

O recorte aprovado é a modernização incremental, por fatia vertical funcional,
da **trilha pedagógica autenticada com leitura estruturada de conteúdo e
persistência de progresso por nível**.

A instância controlada da fatia utilizará a ilha sintética `island-3`
(`Interatividade`), com os três níveis e os nove slides criados pelo
`tools/seed_trail_3x3.sql` do legado. Após a aplicação do seed funcional, esse
conjunto contém somente apresentações não bloqueantes dos tipos `TextText`,
`TextImage` e `TextCode`. O identificador do conjunto é parte do protocolo
experimental; ele não representa escolha de conteúdo pedagógico para uma
eventual versão de produto.

A jornada observável da fatia será:

```text
pessoa autenticada
  → abre a ilha experimental
    → consulta níveis ordenados
      → percorre slides não bloqueantes do nível
        → conclui o nível
          → recupera o progresso em nova consulta ou sessão
            → acessa o próximo nível liberado
```

A escolha confirma, com redução explícita, a hipótese
`Ilha → Nível → Slide → Progresso` do card. Ela preserva o núcleo educacional,
exercita interface, API, autorização, persistência, integridade e testes e evita
importar para a primeira intervenção as falhas e integrações do editor,
sandbox, quiz, CodeBlock, projetos e módulos sociais.

A decisão não afirma que toda a trilha, todo o CodeLife ou todas as regras de
progressão foram modernizados. A versão legada permanece a referência para a
linha de base, e o CodeLife continua sendo o estudo de caso da metodologia
proposta no TCC.

## Fundamentação da escolha

### Aplicação dos critérios do TCC-10

| Critério | Estado na fatia selecionada | Evidência e decisão |
| --- | --- | --- |
| I-01 — alinhamento com a pesquisa | **Atendido** | A fatia permite aplicar planejamento, intervenção e comparação antes/depois sem confundir modernização com funcionalidade nova. |
| I-02 — relevância para o CodeLife | **Atendido** | Ilha, nível, slide e progresso compõem o núcleo pedagógico identificado no TCC-3 e classificado com alta relevância no TCC-7. |
| I-03 — contrato verificável | **Atendido pela presente decisão** | IF-01, IF-02, IF-07, IF-08 e IF-09 são incorporados; IF-03 e IF-10 recebem limites e decisões explícitas abaixo. |
| I-04 — representatividade técnica | **Atendido** | A fatia atravessa interface, contrato HTTP, identidade, regras de acesso, dados e persistência. |
| I-05 — comparabilidade | **Atendido com porta de avanço** | Estrutura e conteúdo possuem evidência no seed e no código; T07/CF-13 validou persistência. Os cenários exatos da ilha escolhida devem ser caracterizados no legado antes de substituição. |
| I-06 — dimensões avaliáveis | **Atendido** | Permite avaliar preservação funcional, testabilidade, manutenibilidade, segurança de dependências, confiabilidade e reprodutibilidade no recorte. |
| I-07 — resultado intermediário | **Atendido** | A jornada completa pode ser executada e demonstrada sem os demais módulos do produto. |
| E-03/E-04 — dependência externa ou cascata | **Mitigado** | Sandbox, screenshot, CMS, social e outras integrações ficam fora; não há serviço remoto obrigatório para concluir a fatia. |
| E-05 — regra insuficientemente compreendida | **Mitigado por delimitação** | Desbloqueio global e `skipped` não são promovidos a invariantes; as regras internas da fatia são decididas abaixo. |
| E-06 — ausência de linha de base | **Não ativo, condicionado à caracterização** | Há linha de base geral e dados repetíveis; a execução dos cenários específicos é obrigatória antes da implementação. |
| E-08 — prazo e recursos | **Controlável** | Uma ilha sintética, três níveis e nove slides delimitam a menor unidade que ainda permite observar sequência e persistência. |

### Comparação com os demais candidatos

| Candidato | Decisão | Justificativa |
| --- | --- | --- |
| Leitura de conteúdo sem progresso | **Absorvido pela fatia principal** | É necessária, mas isoladamente tem menor valor experimental e não exercita persistência. |
| Quiz e atividade bloqueante | **Excluído da primeira intervenção por evidência insuficiente** | T04/CF-08 e T05/CF-09/CF-12 foram reprovados; IF-04 e IF-05 continuam em revisão. |
| Editor, prévia e sandbox | **Excluído por inviabilidade prática no estado atual** | A integração com `codelife.tech`, iframe e `postMessage` não foi reproduzida de forma confiável; T06/CF-11 ficou bloqueado. |
| Desafio final e CodeBlock | **Excluído por cascata e comparabilidade insuficiente** | Depende de editor, validação, CodeBlock e semântica de conclusão da ilha; T09/CF-15 foi reprovado. |
| Projeto individual | **Adiado** | É uma fatia possível, mas T08/CF-14 registrou persistência incompleta e o ganho analítico não é necessário para encerrar o primeiro recorte. |
| Discussões de slides | **Adiado como complemento opcional futuro** | O fluxo foi observado, mas acrescenta autoria, threads e comentários sem ser necessário à evidência principal. |
| CMS de conteúdo | **Excluído da intervenção** | A fatia pode consumir fixtures controladas; modernizar a interface administrativa ampliaria o escopo sem ganho proporcional. |
| Busca, perfil completo, colaboração, social, ranking e moderação | **Fora do recorte** | São periféricos à jornada escolhida ou repetem evidências com maior superfície de autorização e dados. |
| Concurso, pesquisa e estruturas históricas | **Fora do recorte** | São capacidades desativadas, depreciadas ou sem fluxo ativo confirmado. |

## 1. Escopo incluído

### 1.1 Fatia funcional principal

Inclui-se somente o comportamento necessário para que uma pessoa autenticada:

1. acesse a ilha experimental definida no protocolo;
2. consulte seus três níveis em ordem determinística;
3. acesse o primeiro nível e, depois, cada nível liberado;
4. percorra os slides não bloqueantes do nível em ordem determinística;
5. conclua explicitamente o nível ao alcançar o fim da sequência;
6. tenha a conclusão persistida uma única vez;
7. recupere o mesmo estado após nova consulta ou nova sessão;
8. possa revisitar níveis concluídos;
9. tenha o próximo nível liberado somente após a conclusão do anterior.

### 1.2 Apresentações de slide suportadas

O contrato contempla os tipos presentes na ilha sintética selecionada:

- `TextText`;
- `TextImage`;
- `TextCode`, tratado como conteúdo de leitura, sem execução.

O contrato preserva título, conteúdo necessário à leitura, pertencimento ao
nível e ordem. Ele não preserva a composição visual em duas colunas, classes
CSS, uso de `dangerouslySetInnerHTML` ou estrutura interna dos componentes do
legado.

### 1.3 Dependências fundacionais incluídas

São incluídas como meios da fatia, e não como módulos modernizados de forma
completa:

- identidade autenticada mínima e identificador estável da pessoa;
- autorização no servidor para leitura e escrita do próprio progresso;
- representação de ilha, nível, slide e progresso;
- carga repetível da fixture experimental;
- rotas ou contratos de leitura da hierarquia e gravação/consulta do progresso;
- interface mínima para mapa da ilha, lista de níveis, leitura de slides e
  indicação do progresso;
- tratamento dos estados de carregamento, ausência de conteúdo, erro e acesso
  não autorizado;
- testes automatizados e cenários comparativos necessários ao critério de
  parada.

## 2. Escopo excluído

Permanecem explicitamente fora da primeira intervenção:

- cadastro, recuperação de senha, edição de perfil, escolas e geografia;
- mapa global e política de desbloqueio entre todas as ilhas;
- conclusão de ilha, desafio final e CodeBlocks;
- `Quiz`, `InputCode`, `RenderCode`, editor, prévia, execução e sandbox;
- estado `skipped` e efeito de abrir discussões sobre o progresso;
- discussões, threads, comentários, likes e denúncias;
- projetos, colaboração, compartilhamento e screenshots;
- busca, perfis públicos, ranking, moderação, concurso e pesquisa;
- CMS de ilhas, níveis, slides, regras e glossário;
- glossário como funcionalidade navegável;
- internacionalização completa, subdomínios PT/EN e migração de todos os
  conteúdos dos dois idiomas;
- upload e administração de imagens;
- migração integral do banco legado ou de dados históricos de produção;
- integração, substituição ou desligamento da aplicação legada em produção;
- reprodução pixel a pixel e reconstrução integral da identidade visual;
- modernização de módulos adicionais apenas porque uma dependência técnica foi
  encontrada durante a implementação.

Essas exclusões delimitam a comparação. Um item fora do recorte não deve ser
contabilizado como regressão da versão modernizada, nem sua ausência deve ser
usada para afirmar que o produto inteiro foi atualizado.

## 3. Invariantes funcionais e decisões sobre ambiguidades

### 3.1 Invariantes preservados

| ID | Contrato no recorte | Origem |
| --- | --- | --- |
| R11-IF-01 | Ilha contém níveis e nível contém slides; os vínculos válidos e a ordem devem ser recuperáveis. | IF-01, modelos `islands`, `levels` e `slides`. |
| R11-IF-02 | A pessoa autenticada pode percorrer em sequência os slides não bloqueantes do nível selecionado. | IF-02 e fluxo revalidado em `Slide.jsx`. |
| R11-IF-03 | A conclusão explícita do nível deve ser associada à pessoa e recuperável posteriormente. | IF-07 e T07/CF-13. |
| R11-IF-04 | Um nível concluído pode ser revisitado sem perder o estado registrado. | Finalidade de continuidade da trilha e IF-07. |
| R11-IF-05 | Uma conclusão válida não pode ser rebaixada por atualização posterior incompatível. | IF-08 e proteção existente em `userprogressRoute.js`. |

### 3.2 Adaptações funcionais deliberadas

| ID | Decisão | Justificativa e efeito na comparação |
| --- | --- | --- |
| R11-A-01 | A escrita de progresso será aceita somente para a pessoa autenticada, para nível existente da ilha experimental e em transição permitida. | Fortalece IF-09 e elimina a aceitação de identificadores/estados livres. É adaptação de robustez, não nova regra pedagógica. |
| R11-A-02 | A unidade de progresso será exclusivamente o **nível**. Não serão armazenados IDs de ilha no mesmo campo. | Resolve a ambiguidade de `userprogress.level` e permite FK/contrato inequívoco. Conclusão de ilha não integra a comparação. |
| R11-A-03 | O conjunto inicial de estados da fatia terá apenas `completed`; ausência de registro significa não concluído. | `skipped` possui semântica ambígua e fica fora. A mudança deve ser analisada como adaptação, não como preservação estrita desse estado. |
| R11-A-04 | Abrir, fechar ou navegar por conteúdo não produzirá efeitos colaterais de progresso; somente a ação de conclusão ao fim do nível poderá persistir `completed`. | Evita o acoplamento entre discussão e `skipped` identificado em IF-10/IF-15. |
| R11-A-05 | A API validará também a ordem de liberação: o primeiro nível está disponível; os demais exigem conclusão do nível imediatamente anterior. | Torna a regra uniforme em interface, rota e servidor e impede acesso direto incoerente. |

### 3.3 Decisões para itens anteriormente classificados como revisão

**IF-03 — liberação de percurso.** A divergência entre bloqueio no mapa e
acesso direto a ilhas não será resolvida como regra global nesta intervenção.
A ilha `island-3` é a entrada explícita do protocolo e fica disponível a toda
pessoa autenticada no ambiente experimental. Dentro dela, a liberação é
sequencial por nível conforme R11-A-05. Nenhuma equivalência será alegada para
desbloqueio entre ilhas.

**IF-10 — `skipped`.** O estado não integra o modelo nem os testes de
preservação do recorte. A versão modernizada não interpretará discussão,
abandono ou pedido de ajuda como conclusão. Uma futura retomada deverá definir
se `skipped` representa ajuda, abandono, revisão ou outro estado e quais efeitos
ele produz.

**IF-04 e IF-05 — atividades bloqueantes.** Permanecem fora da intervenção.
As falhas observadas de quiz e validação de código não são preservadas nem
corrigidas silenciosamente por este recorte.

## 4. Dependências necessárias e fronteiras

| Dependência | Tratamento mínimo | Limite explícito |
| --- | --- | --- |
| Identidade | Sessão ou mecanismo equivalente que forneça ID estável; endpoints de progresso protegidos no servidor. | Não inclui cadastro, recuperação de senha, perfil completo ou papéis administrativos. |
| Conteúdo | Fixture versionada com a ilha `island-3`, seus níveis, slides, vínculos e ordenação. | Não inclui importação de todo o CMS, conteúdo histórico ou edição administrativa. |
| Persistência | Ilha, nível, slide e progresso com integridade suficiente para os cenários aprovados. | Não inclui schema completo do CodeLife nem migração de dados de produção. |
| Interface | Entrada da ilha, lista de níveis, leitor/navegação de slides e indicação de concluído/bloqueado. | Não inclui mapa global, identidade visual completa ou telas sociais. |
| API/lógica | Consulta hierárquica ordenada; consulta e conclusão de progresso; verificação de autorização e pré-requisito. | Não inclui compatibilidade com todas as rotas do backend legado. |
| Avaliação | Dados repetíveis, testes funcionais, registro de build/execução e coleta pós-intervenção equivalente no recorte. | Não exige repetir métricas globais sobre bases de tamanho incomparável sem contextualização. |

### Fonte de verdade, coexistência e retorno

A implementação modernizada terá fonte de verdade própria apenas para a
fixture e o progresso do recorte. Não haverá escrita dupla no banco legado nem
sincronização bidirecional. O legado permanecerá intacto e executável como
referência da linha de base.

Como não existe troca de produção prevista, o retorno consiste em desativar a
execução da fatia modernizada e continuar utilizando o legado para consulta e
comparação. Dados sintéticos da versão modernizada poderão ser recriados pelo
procedimento de seed; nenhum rollback destrutivo de dados históricos faz parte
do experimento.

## 5. Limites da modernização de dados

A modelagem física pode ser alterada, desde que preserve os conceitos e os
vínculos usados pela fatia. Para o recorte, espera-se no mínimo:

- chave estável para pessoa, ilha, nível e slide;
- relação nível → ilha e slide → nível com integridade referencial;
- unicidade da ordem do nível dentro da ilha e da ordem do slide dentro do
  nível, ou validação equivalente que impeça sequência ambígua;
- relação de progresso entre pessoa e nível;
- unicidade de progresso por `(pessoa, nível)`;
- data de conclusão registrada quando aplicável;
- estado restrito ao contrato aprovado;
- rejeição de nível inexistente, vínculo inválido e atualização não autorizada.

É permitido renomear campos, normalizar tabelas, separar DTOs e entidades,
adotar migrations e reforçar constraints. Não é permitido alterar o sentido de
ilha, nível, slide ou conclusão sem registrar nova decisão. HTML e demais
conteúdos da fixture devem ser tratados como dados controlados; a forma segura
de renderização pode mudar e não está vinculada ao uso de
`dangerouslySetInnerHTML` do legado.

## 6. Limites da modernização arquitetural

A arquitetura e a stack alvo não são definidas por este card. Elas poderão ser
escolhidas no planejamento desde que:

- entreguem a fatia de ponta a ponta, e não apenas uma camada isolada;
- mantenham separáveis interface, regras de progressão, persistência e
  identidade em nível suficiente para testes;
- apliquem autorização e integridade no servidor, sem depender apenas de
  bloqueios visuais;
- permitam execução local repetível e coleta das evidências selecionadas;
- não introduzam sandbox, filas, serviços remotos, microserviços ou outras
  dependências que não sejam necessárias ao contrato;
- mantenham rastreabilidade entre história, regra, teste e alteração;
- não sejam usadas como justificativa autônoma de melhoria.

Uma modernização horizontal de banco, backend ou frontend pode ocorrer como
técnica interna, mas somente será considerada concluída quando produzir o
comportamento vertical observável da fatia.

## 7. Limites da interface e da experiência

A interface modernizada não precisa reproduzir o CodeLife pixel a pixel. É
permitido:

- adotar componentes e organização visual atuais;
- melhorar responsividade, acessibilidade, legibilidade e navegação por
  teclado;
- oferecer feedback explícito de carregamento, erro, bloqueio e conclusão;
- reorganizar CSS e componentes;
- substituir ícones, espaçamentos e composição de painéis;
- exibir `TextCode` como trecho de código somente leitura.

Devem permanecer reconhecíveis:

- a relação entre ilha, níveis e slides;
- a ordem e a finalidade do conteúdo;
- a ação de avançar/retornar entre slides;
- a indicação de nível disponível, bloqueado ou concluído;
- a confirmação de conclusão e a recuperação do progresso.

A interface não poderá liberar um nível que o servidor considera bloqueado,
marcar conclusão por simples carregamento de página ou ocultar falha de
persistência como sucesso visual.

## 8. Critérios de suficiência e parada

A intervenção será considerada suficiente para iniciar a avaliação quando
todos os itens obrigatórios abaixo forem atendidos no mesmo commit ou versão
identificada:

1. o ambiente modernizado puder ser instalado, configurado e executado a
   partir de instruções versionadas;
2. a fixture `island-3` puder ser criada de forma repetível;
3. os vínculos e a ordem dos três níveis e nove slides forem preservados;
4. os tipos `TextText`, `TextImage` e `TextCode` da fixture forem apresentados
   sem depender do sandbox;
5. pessoa não autenticada não puder ler ou alterar o progresso;
6. o primeiro nível estiver disponível e os seguintes obedecerem à liberação
   sequencial definida;
7. acesso direto a nível bloqueado for rejeitado ou redirecionado de modo
   consistente;
8. a conclusão dos três níveis puder ser persistida e recuperada após nova
   sessão;
9. uma conclusão não puder ser duplicada nem rebaixada;
10. identificadores inexistentes, vínculos inválidos e alterações de progresso
    de outra pessoa forem rejeitados;
11. os testes automatizados associados a R11-IF-01--R11-IF-05 e
    R11-A-01--R11-A-05 estiverem aprovados;
12. os mesmos cenários funcionais tiverem sido executados no legado e na versão
    modernizada, com diferenças e limitações registradas;
13. a coleta pós-intervenção registrar, para o mesmo recorte, ao menos
    preservação funcional, build/execução, testes, análise estática aplicável,
    auditoria de dependências e reprodutibilidade;
14. qualquer mudança de ferramenta, tamanho do recorte ou procedimento estiver
    acompanhada de justificativa de equivalência e leitura contextualizada;
15. não existir item classificado como revisão dentro do comportamento
    contabilizado como preservado.

Atendidos esses critérios, **não é necessário** acrescentar quiz, editor,
CodeBlock, projeto, discussão, CMS, busca ou qualquer outro módulo para declarar
o recorte implementado. Resultado técnico pior, regressão encontrada ou medida
não coletável não autoriza expansão automática: o resultado deve ser registrado
e discutido na avaliação.

### Porta de avanço anterior à implementação

Antes do primeiro card de código, os cenários 3, 6, 7, 8 e 9 acima devem ser
executados sobre o legado com a fixture limpa e registrados como linha de base
específica. Se a ilha selecionada não puder ser caracterizada, o trabalho deve
registrar a limitação e revisar a fixture ou o contrato; não deve inventar o
resultado esperado nem ampliar o recorte para compensar a ausência de
evidência.

## 9. Próxima decomposição

Após a aprovação desta decisão, o backlog de implementação deverá ser criado
na ordem funcional abaixo. Cada item deve produzir entrega verificável ou uma
porta de avanço explícita.

1. **Caracterizar a fatia no legado:** executar e registrar hierarquia,
   navegação, liberação e progresso da `island-3` em base limpa.
2. **Fixar contratos e fixture:** versionar dados, estados, payloads, erros e
   cenários de teste aprovados.
3. **Preparar execução e identidade mínima:** ambiente repetível e pessoa de
   teste autenticada, sem ampliar para gestão completa de contas.
4. **Entregar leitura estruturada:** ilha, níveis e slides ordenados de ponta a
   ponta, com testes de integridade e apresentação.
5. **Entregar navegação e liberação sequencial:** regras uniformes no servidor
   e na interface, incluindo acesso direto.
6. **Entregar persistência de progresso:** conclusão idempotente, recuperação e
   proteção contra rebaixamento ou alteração indevida.
7. **Consolidar testes de preservação:** executar os cenários equivalentes
   antes/depois e registrar desvios.
8. **Repetir a coleta técnica do recorte:** build, testes, análise estática,
   dependências e protocolo de reprodução.
9. **Produzir a avaliação da aplicação:** interpretar preservações, adaptações,
   regressões, medidas, riscos residuais e limitações sem generalização
   universal.

Esses itens podem se tornar histórias de um épico de implementação, mas não
devem ser decompostos por biblioteca ou camada antes de manter a rastreabilidade
com a jornada funcional.

## 10. Riscos residuais e limitações

- A base é sintética e não representa dados históricos ou operação de
  produção.
- A ilha escolhida é um instrumento controlado; ela não demonstra preservação
  de todo o conteúdo pedagógico do CodeLife.
- A evidência funcional registrada até aqui validou persistência de progresso
  em outro ponto da trilha sintética. Por isso, a caracterização exata da
  `island-3` é uma porta de avanço obrigatória.
- A exclusão de `skipped`, atividades bloqueantes e conclusão de ilha reduz o
  alcance funcional e precisa permanecer visível na avaliação.
- Contagens estruturais de uma fatia nova e do legado inteiro não são
  diretamente comparáveis. Métricas devem usar recorte equivalente ou declarar
  a diferença.
- A ausência atual de código modernizado impede estimar esforço real ou afirmar
  melhoria técnica antecipadamente.
- A escolha de uma única fatia em um único sistema web legado produz evidência
  de aplicabilidade no estudo de caso, não validação universal da metodologia.

## 11. Rastreabilidade com os critérios de aceite do TCC-11

| Critério de aceite | Atendimento nesta decisão |
| --- | --- |
| Recorte obtido dos critérios anteriores | Atendido pela aplicação explícita do TCC-7, TCC-8, TCC-9 e TCC-10. |
| Inclusões e exclusões justificadas | Atendido pelas seções 1, 2 e pela comparação de candidatos. |
| Invariantes associados ao recorte | Atendido por R11-IF-01--R11-IF-05 e pelas decisões para os itens R. |
| Dependências conhecidas sem reescrita indireta | Atendido pela fronteira mínima de identidade, conteúdo, persistência, interface, API e avaliação. |
| Limites de regra de negócio claros | Atendido pela separação entre preservações, adaptações deliberadas e comportamentos excluídos. |
| Limites visuais claros | Atendido pela preservação de finalidade e semântica sem exigência pixel a pixel. |
| Critério de parada | Atendido pelos quinze itens obrigatórios e pela proibição de expansão automática. |
| Medidas repetíveis e comparação antes/depois | Atendido pela porta de caracterização e pela repetição funcional e técnica no mesmo recorte. |
| Base suficiente para épicos e histórias | Atendido pela decomposição funcional e pelas portas de avanço registradas. |

## Fontes locais principais

- [Inventário funcional — TCC-3](inventario-funcional-codelife-legado.md)
- [Modelo de dados — TCC-4](relatorio-revalidacao-modelo-dados-legado-tcc-4.md)
- [Fluxos e regras — TCC-5](revalidacao-fluxos-regras-negocio-tcc-5.md)
- [Mapa de dependências — TCC-6](mapa-dependencias-codelife-legado-tcc-6.md)
- [Classificação de módulos — TCC-7](matriz-classificacao-modulos-fluxos-codelife-tcc-7.md)
- [Catálogo de invariantes — TCC-8](catalogo-invariantes-funcionais-codelife-tcc-8.md)
- [Comparação de estratégias — TCC-9](comparacao-estrategias-modernizacao-codelife-tcc-9.md)
- [Critérios de inclusão e exclusão — TCC-10](criterios-inclusao-exclusao-recorte-codelife-tcc-10.md)
- [`Diagnóstico da base sintética`](https://github.com/PedroRonzani18/codelife/blob/9f023a464218155e38de0fa98359236ed062fd5a/docs/diagnostico-base-funcional.md)
- [`Resultados dos testes funcionais`](https://github.com/PedroRonzani18/codelife/blob/9f023a464218155e38de0fa98359236ed062fd5a/docs/resultados-testes-funcionais-codelife.md)
- [`Metodologia proposta no TCC`](https://github.com/PedroRonzani18/TCC/blob/cfc87f09d20eabcd290e1f988eaaf202c31e12fb/capitulos/05-andamento.tex)
- [`Aplicação experimental e linha de base`](https://github.com/PedroRonzani18/TCC/blob/cfc87f09d20eabcd290e1f988eaaf202c31e12fb/capitulos/06-aplicacao-experimental.tex)
- [`Avaliação, limitações e conclusões`](https://github.com/PedroRonzani18/TCC/blob/cfc87f09d20eabcd290e1f988eaaf202c31e12fb/capitulos/07-conclusoes.tex)

## Conclusão

O recorte experimental fica congelado na trilha autenticada da ilha sintética
`island-3`, com leitura de três níveis e nove slides não bloqueantes e progresso
persistido por nível. Essa fatia é pequena o suficiente para permitir
implementação e avaliação dentro do TCC e representativa o suficiente para
exercitar uma modernização vertical com comportamento, dados, servidor,
interface e testes.

As ambiguidades do legado não foram promovidas a requisitos: desbloqueio global,
`skipped`, quiz, validação de código e conclusão de ilha ficam fora da
comparação ou recebem adaptação explicitamente registrada. A intervenção pode
ser considerada suficiente quando os contratos e as evidências definidos neste
documento forem satisfeitos; nenhum módulo adicional é necessário para avançar
à avaliação.
