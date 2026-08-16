# Critérios de inclusão e exclusão do recorte experimental do CodeLife — TCC-10

**Card:** TCC-10 — Definir critérios de inclusão e exclusão de módulos no recorte

**Data da análise:** 16 de agosto de 2026

**Legado analisado:** `../codelife`, commit `9f023a464218155e38de0fa98359236ed062fd5a`

**Estado da versão migrada consultado:** `../codelife-migrado`, commit `6e511e84d12e478b146a2ece28e8e566233065a1`

**TCC consultado:** `../TCC`, commit `cfc87f09d20eabcd290e1f988eaaf202c31e12fb`

**Objetivo:** estabelecer regras objetivas, rastreáveis e reutilizáveis para
decidir quais módulos e fluxos do CodeLife poderão compor o recorte
experimental da modernização e quais deverão permanecer fora da intervenção.

## Escopo, fontes e limites

Este documento transforma os resultados dos cards anteriores em um procedimento
de delimitação. As fontes principais são:

- o [inventário funcional revalidado (TCC-3)](inventario-funcional-codelife-legado.md);
- o [relatório do modelo de dados (TCC-4)](relatorio-revalidacao-modelo-dados-legado-tcc-4.md);
- a [revalidação dos fluxos e regras de negócio (TCC-5)](revalidacao-fluxos-regras-negocio-tcc-5.md);
- o [mapa de dependências (TCC-6)](mapa-dependencias-codelife-legado-tcc-6.md);
- a [matriz de classificação dos módulos (TCC-7)](matriz-classificacao-modulos-fluxos-codelife-tcc-7.md);
- o [catálogo de invariantes funcionais (TCC-8)](catalogo-invariantes-funcionais-codelife-tcc-8.md);
- a [comparação de estratégias (TCC-9)](comparacao-estrategias-modernizacao-codelife-tcc-9.md);
- a metodologia proposta e a linha de base registradas nos capítulos 5 e 6 do
  TCC;
- o código e os resultados de testes do legado no commit indicado.

A análise considera a estratégia recomendada no TCC-9: modernização
incremental por fatias verticais funcionais. Consequentemente, um recorte não é
tratado apenas como uma tela ou tabela, mas como um comportamento observável
com as partes de dados, servidor, interface e validação necessárias para
executá-lo de ponta a ponta.

O documento **não escolhe definitivamente o recorte**, não define arquitetura
alvo, não estima horas e não implementa módulos. O seu produto é a regra de
decisão que deverá ser aplicada antes da seleção final. A evidência do legado é
estática e baseada também em testes sobre base sintética; ela não demonstra a
operação atual de portais, DNS, credenciais, serviços remotos ou dados
históricos de produção.

## Convenções de aplicação

Cada critério deve receber um dos quatro estados abaixo para cada candidato.
Não se deve substituir evidência ausente por estimativa.

| Estado | Significado |
| --- | --- |
| **Atendido** | Há evidência verificável suficiente para aplicar o critério sem decisão pendente material. |
| **Parcial/condicionado** | Parte da evidência existe, mas há decisão, teste ou mitigação obrigatória antes da seleção. |
| **Não atendido** | A evidência disponível contraria o critério ou mostra que o candidato não satisfaz a condição. |
| **Não verificável** | A evidência necessária ainda não foi produzida; o estado não equivale a aprovação nem reprovação. |

As naturezas usadas na matriz são:

- **inclusão:** condição que torna o candidato apto ou aumenta diretamente seu
  valor para o experimento;
- **exclusão:** condição que impede o avanço no estado atual ou demonstra baixo
  valor experimental;
- **ponderação:** condição usada para comparar candidatos elegíveis e definir
  limites, mitigação e ordem de execução.

## Matriz de critérios

| ID | Critério | Definição operacional | Natureza | Evidência necessária | Impacto esperado na decisão | Observações e exceções |
| --- | --- | --- | --- | --- | --- | --- |
| I-01 | Alinhamento com o objetivo da pesquisa | O candidato deve produzir evidência sobre a aplicação da metodologia de atualização, e não apenas entregar uma funcionalidade nova ou trocar tecnologia. | Inclusão | Relação explícita com uma ou mais etapas da metodologia, com as dimensões de avaliação do TCC e com a comparação antes/depois. | **Obrigatório para avançar.** Sem alinhamento, o item não compõe o experimento. | Uma necessidade do produto pode ser legítima e ainda assim ficar fora do recorte acadêmico. |
| I-02 | Relevância para a finalidade do CodeLife | O comportamento deve representar a proposta educacional, uma regra central ou uma pré-condição indispensável do fluxo escolhido. | Inclusão | Inventário TCC-3, finalidade documentada, rotas/fluxos do legado e classificação de relevância do TCC-7. | Favorece candidatos centrais e evita selecionar apenas telas simples. | Recurso transversal, como autenticação, pode ser incluído como dependência sem se tornar o objeto principal da intervenção. |
| I-03 | Contrato funcional verificável | O candidato deve possuir invariantes classificados como preservar/adaptar ou decisões explícitas que convertam itens em revisão em resultados testáveis. | Inclusão | Itens IF do TCC-8, regras revalidadas no TCC-5 e cenários com pré-condição, ação e resultado esperado. | **Obrigatório para implementar.** Item em revisão pode permanecer candidato, mas não entra na intervenção antes da decisão. | Falha do legado não vira requisito; o contrato pode corrigir comportamento quando a adaptação estiver justificada. |
| I-04 | Representatividade técnica da fatia | A fatia deve exercitar combinação suficiente de interface, API/lógica, persistência, autorização ou integração para permitir avaliar uma atualização real. | Inclusão | Mapa TCC-6, matriz TCC-7 e rastreabilidade dos componentes, APIs, entidades e contratos afetados. | Favorece fatias verticais; uma apresentação isolada tende a ser complementar. | Nem toda fatia precisa usar todas as camadas, desde que produza evidência técnica não trivial e coerente com seu contrato. |
| I-05 | Comparabilidade antes/depois | O mesmo comportamento ou um equivalente formalmente justificado deve poder ser observado no legado e na versão atualizada. | Inclusão | Checklist CF, testes T01--T15, linha de base do TCC, cenário de caracterização e regra de equivalência dos instrumentos. | **Obrigatório para avançar.** Sem referência comparável, não é possível atribuir efeitos à intervenção. | Quando a execução legada estiver bloqueada, evidência estática isolada só é suficiente se o limite e a forma de comparação forem explicitados e aceitos. |
| I-06 | Capacidade de avaliar dimensões relevantes | O candidato deve permitir coletar evidências em preservação funcional e em pelo menos uma dimensão técnica pertinente ao recorte. | Inclusão | Vínculo com preservação funcional e com manutenibilidade, testabilidade, segurança, confiabilidade, compatibilidade ou reprodutibilidade; medidas e instrumentos previstos. | Aumenta o valor experimental e ajuda a distinguir modernização de simples reprodução visual. | Dimensões contextuais, como dados e acessibilidade, entram apenas quando relevantes e viáveis. Não se exige usar todo o catálogo de métricas. |
| I-07 | Resultado intermediário executável | A fatia deve produzir um estado demonstrável de ponta a ponta antes da conclusão de toda a modernização. | Inclusão | Entrada, saída, fonte de dados, validação e critério de conclusão da fatia; condição de demonstração local repetível. | Favorece candidatos que permitam avaliar a metodologia dentro do prazo. | Artefato documental ou camada técnica isolada pode ser pré-requisito, mas não satisfaz sozinho este critério como recorte principal. |
| E-01 | Baixo valor experimental | O candidato é periférico, histórico ou pouco relacionado ao objetivo da pesquisa e não acrescenta evidência relevante às dimensões avaliadas. | Exclusão | Finalidade no TCC-3/TCC-7, estado de uso no código e contribuição incremental esperada para a avaliação. | Exclui por **baixo valor acadêmico**, ainda que seja tecnicamente viável. | A exclusão não declara que a funcionalidade seja irrelevante para o produto original. |
| E-02 | Redundância de evidência | Outro candidato já produz as mesmas evidências funcionais e técnicas com fronteira menor ou risco mais controlável. | Exclusão | Comparação lado a lado das dimensões, contratos, dependências e instrumentos cobertos por ambos. | Exclui ou rebaixa a complemento para evitar ampliar o recorte sem ganho analítico. | Pode permanecer quando for dependência obrigatória ou acrescentar comportamento/invariante distinto. |
| E-03 | Dependência externa indisponível e não isolável | O fluxo depende de serviço, credencial, domínio ou infraestrutura não reproduzível, sem substituto controlado capaz de preservar o contrato. | Exclusão | Teste da dependência, evidência de disponibilidade e contrato de adaptador, substituição ou simulação controlada. | Exclui por **inviabilidade prática** enquanto não houver mitigação verificável. | A tecnologia ou o provedor legado não precisam ser preservados; a exclusão deixa de valer se a finalidade puder ser isolada com contrato equivalente. |
| E-04 | Expansão por dependências em cascata | A inclusão obriga tratar módulos adicionais que não são necessários ao contrato da fatia e aproxima o trabalho de uma reconstrução integral. | Exclusão | Grafo TCC-6, lista de dependências mínimas/adiáveis, fronteira de dados, APIs e autorização. | Impede o avanço até que a fronteira seja reduzida ou a dependência seja justificada como obrigatória. | Dependência técnica não implica inclusão de sua interface completa; adaptador, conversor ou leitura temporária podem limitar o escopo. |
| E-05 | Regra de negócio insuficientemente compreendida | Há ambiguidade ou divergência material sem decisão capaz de produzir resultado esperado e teste verificável. | Exclusão | Itens R do TCC-8, divergências TCC-5, evidência do código e decisão registrada sobre o comportamento desejado. | Suspende a seleção por **insuficiência de evidência**, não por baixa relevância. | Módulos centrais continuam candidatos; voltam a avançar quando a regra e os testes forem definidos. |
| E-06 | Ausência de linha de base comparável | Não há observação, cenário reprodutível ou procedimento equivalente capaz de sustentar comparação antes/depois. | Exclusão | Linha de base funcional/técnica, dados de teste, instrumentos, recorte e limitações declaradas. | Exclui enquanto a caracterização não puder ser produzida. | “Não validado” exige nova coleta; “reprovado” pode servir como linha de base quando o resultado e a expectativa estiverem claramente separados. |
| E-07 | Funcionalidade desativada, depreciada ou sem fluxo ativo | O código residual não corresponde a uma capacidade atual necessária ao experimento. | Exclusão | Comentários/modelos, rotas ativas, configuração e evidência de uso no inventário TCC-3/TCC-4. | Exclui por baixo valor e evita modernizar estruturas apenas porque permanecem no repositório. | Uma retomada futura requer novo objetivo e nova evidência; presença de tabela ou arquivo não comprova uso. |
| E-08 | Incompatibilidade com prazo e recursos | Mesmo com contrato conhecido, a menor fatia coerente não cabe nas restrições acadêmicas, de ambiente ou de execução disponíveis. | Exclusão | Decomposição mínima, pré-condições, riscos, disponibilidade de ambiente e plano verificável; não exige estimativa falsa de precisão. | Exclui por **inviabilidade prática** no recorte atual. | Complexidade ou risco altos, isoladamente, não bastam; a exclusão exige mostrar que não há redução ou mitigação compatível com o contrato. |
| P-01 | Complexidade e risco controláveis | Complexidade, ambiguidade, segurança, integridade e risco de regressão devem ter mitigação proporcional ao valor experimental. | Ponderação | Classificação TCC-7, riscos do TCC-3 a TCC-6, invariantes, testes de caracterização e plano de mitigação. | Define prioridade e pré-condições entre candidatos elegíveis. | Risco alto pode aumentar o valor acadêmico; ele só bloqueia quando não é controlável no escopo. |
| P-02 | Dependências mínimas e possibilidade de isolamento | A fatia deve distinguir dependências obrigatórias, substituíveis e adiáveis, incluindo fonte de verdade e autorização. | Ponderação | Mapa TCC-6, contratos de conteúdo/dados, fronteira de identidade, APIs e estratégia de coexistência. | Favorece o candidato com fronteira mais clara e menor efeito cascata para evidência equivalente. | Poucas dependências não significam automaticamente maior valor; uma fatia simples ainda precisa satisfazer I-01 a I-07. |
| P-03 | Maturidade das evidências | Quanto mais consistente for a combinação de código, teste observado, linha de base e invariante, menor a incerteza da seleção. | Ponderação | Triangulação entre TCC-3 a TCC-8, CF/T01--T15 e código no commit delimitado. | Ordena investigação e implementação; candidatos com evidência parcial exigem caracterização antes. | Evidência estática confirma implementação, não operação; base sintética não representa produção. |
| P-04 | Coexistência, isolamento de falha e retorno | O incremento deve poder coexistir com funcionalidades não migradas e possuir condição de isolamento ou retorno compatível com o risco. | Ponderação | Fonte de verdade, roteamento, escrita de dados, limites da fatia, rollback e tratamento de falhas. | Favorece candidatos capazes de produzir resultado intermediário sem substituição abrupta do produto. | Rollback pode significar desativar rota/feature e preservar dados; não exige necessariamente reversão destrutiva de migração. |
| P-05 | Ganho analítico incremental | Entre candidatos elegíveis, deve-se preferir a combinação que amplia a capacidade de avaliar a metodologia sem repetir evidências já obtidas. | Ponderação | Mapa das dimensões, invariantes e instrumentos cobertos por cada alternativa. | Ajuda a compor fatia principal e complementos sem maximizar quantidade de funcionalidades. | Um complemento só entra quando acrescenta dimensão, contrato ou risco relevante e controlável. |

## Procedimento de decisão

A matriz não deve ser convertida em soma automática. Uma pontuação alta em
simplicidade não compensa ausência de contrato funcional, assim como alta
relevância não compensa uma dependência externa impossível de controlar. A
decisão deve seguir a ordem abaixo.

### 1. Definir a unidade candidata

Descrever o candidato como fatia funcional, com:

- ator e finalidade;
- pré-condições e entrada;
- comportamento e resultado esperado;
- dados, API, interface e autorização necessários;
- invariantes aplicáveis;
- dependências obrigatórias, substituíveis e adiáveis;
- evidências antes/depois e dimensões avaliáveis;
- limite explícito do que permanece fora.

### 2. Verificar elegibilidade

Um candidato somente pode seguir para comparação final quando:

1. I-01, I-03 e I-05 estiverem **atendidos**;
2. I-02 e I-04 forem pelo menos suficientes para evitar um recorte trivial —
   para uma fatia principal, ambos devem ser no mínimo médios e pelo menos um
   deve ser alto na escala do TCC-7;
3. I-06 e I-07 estiverem atendidos ou possuírem condição objetiva de
   atendimento antes da intervenção;
4. nenhum critério E-03 a E-08 estiver ativo sem mitigação verificável.

Se I-03 estiver condicionado por um item **R** do TCC-8, o módulo pode continuar
na lista de candidatos, mas a decisão sobre a regra e seu teste se torna um
critério de avanço obrigatório anterior à implementação.

### 3. Registrar o motivo de não avanço

O registro deve distinguir explicitamente:

- **baixo valor experimental:** E-01, E-02 ou E-07;
- **inviabilidade prática no estado atual:** E-03, E-04 ou E-08;
- **evidência/contrato insuficiente:** E-05 ou E-06.

Essa distinção impede interpretar um módulo central e arriscado como
academicamente irrelevante e evita tratar uma funcionalidade periférica como
boa escolha apenas porque é fácil de implementar.

### 4. Ponderar somente os candidatos elegíveis

Aplicar P-01 a P-05 comparativamente, sem soma cega. Quando dois candidatos
produzirem evidência equivalente, deve prevalecer aquele com fronteira mais
controlável. Quando o candidato mais complexo produzir evidência acadêmica
materialmente distinta, ele pode prevalecer se as mitigações e as condições de
conclusão estiverem registradas.

### 5. Congelar e justificar o recorte

A decisão final deve registrar:

- fatia principal e eventuais complementos;
- critérios atendidos, condicionados e não atendidos;
- invariantes P/A incluídos, decisões para itens R e itens D fora da comparação;
- dependências mínimas e adaptações aceitas;
- evidências e instrumentos antes/depois;
- riscos, condição de isolamento/retorno e limitações;
- motivo de exclusão dos demais candidatos.

Dependências descobertas depois desse congelamento não entram automaticamente.
Sua inclusão exige demonstrar que são necessárias ao contrato da fatia; caso
contrário, devem ser adaptadas, simuladas ou adiadas.

## Formulário reutilizável por candidato

| Campo | Registro obrigatório |
| --- | --- |
| Candidato | Nome da fatia funcional, não apenas da tela ou camada técnica. |
| Finalidade e ator | Problema funcional observado e pessoa/papel envolvido. |
| Limite | Entrada, resultado e funcionalidades explicitamente fora. |
| Invariantes | IDs P/A aplicáveis; decisão e teste para cada item R; itens D excluídos. |
| Evidência do legado | Código, CF/teste, dados e limitações da observação. |
| Evidência pós-intervenção | Cenário e instrumento equivalente previsto. |
| Dimensões avaliáveis | Preservação funcional e dimensões técnicas pertinentes. |
| Dependências | Obrigatórias, substituíveis e adiáveis, com fonte de verdade. |
| Critérios I/E | Estado e justificativa para cada critério aplicável. |
| Ponderação | P-01 a P-05, comparados com as outras alternativas elegíveis. |
| Resultado | Avança, avança condicionado ou não avança, com motivo categorizado. |

## Teste de consistência sobre os candidatos já classificados

A tabela abaixo demonstra que as regras podem ser aplicadas à matriz TCC-7.
Ela **não constitui a escolha final do recorte**.

| Candidato do TCC-7 | Sinais de inclusão | Bloqueios/ponderações observados | Resultado da aplicação no estado atual |
| --- | --- | --- | --- |
| Trilha autenticada com progresso | Alta relevância e representatividade; combina conteúdo, identidade, API, persistência e estado; IF-01, IF-02, IF-07--IF-09; T07/CF-13 fornecem evidência de persistência. | IF-03 e IF-10 exigem decisão sobre liberação e `skipped`; `userprogress` mistura IDs e não garante integridade física. | **Avança condicionado** à definição do contrato de progresso, acesso, estados e testes de caracterização. |
| Leitura estruturada de conteúdo | Núcleo pedagógico com relação ilha → nível → slide; IF-01 e IF-02; fronteira de leitura relativamente controlável. | Representatividade técnica menor sem estado/persistência; pode ser redundante se absorvida pela trilha com progresso. | **Elegível como complemento ou incremento preparatório**; não é automaticamente a fatia principal. |
| Quiz e atividade bloqueante | Alta relevância e representatividade; permite avaliar regra, estado e validação. | IF-04/IF-05 estão em revisão; T04/T05 foram reprovados e não fornecem contrato aprovado. | **Não avança para implementação no estado atual** por E-05; permanece candidato após decisão e caracterização. |
| Editor, prévia e sandbox | Alto valor técnico e ligação com atividades educacionais, projetos e CodeBlocks. | Dependência de `codelife.tech`/`postMessage`; T05/T06 registram falha/bloqueio; forte cascata para editor, regras e execução. | **Não avança no estado atual por inviabilidade prática e comparabilidade insuficiente** (E-03/E-06), salvo isolamento de uma subcapacidade com contrato próprio. |
| Projeto individual | Interface, API, persistência e autoria formam fatia potencialmente isolável; IF-11/IF-12. | T08 foi parcial e o conteúdo não persistiu na observação; editor e screenshot precisam ser separados do CRUD. | **Avança condicionado** a reteste de persistência, contrato de autoria e exclusão explícita de preview/screenshot não essenciais. |
| Discussões de slides | T11/CF-19 foram validados; IF-14 preserva associação e recuperação; exercita sessão, API e persistência sem sandbox. | Relevância funcional média; IF-15 exige separar discussão de `skipped`; likes/moderação devem ficar fora inicialmente. | **Elegível como complemento**, desde que acrescente evidência não redundante à fatia principal. |
| CMS de conteúdo | Alta relevância para compatibilidade dos formatos consumidos pela trilha; IF-20. | Alto acoplamento com hierarquia, HTML/JSON, papéis e upload; interface administrativa não é necessária para ler conteúdo convertido. | **Condicionado à necessidade do contrato da fatia**; pode ser excluído por E-02/E-04 se um conversor ou fonte temporária for suficiente. |
| Busca, perfil, social, ranking e moderação | Algumas capacidades possuem testes positivos e exercitam persistência/API. | Relevância periférica para a primeira intervenção; privacidade, polimorfismo, mídia e moderação ampliam o escopo; IF-17 está fora do primeiro contrato. | **Não avança como recorte principal por baixo valor experimental ou redundância** (E-01/E-02), sem negar valor ao produto. |
| Concurso, pesquisa e estruturas históricas | Há código ou modelos residuais identificados. | Capacidades desativadas/depreciadas ou sem fluxo ativo; baixa relação com o experimento. | **Não avança por E-07 e E-01.** |

O teste evidencia que o procedimento não seleciona automaticamente o item mais
simples nem elimina automaticamente o mais arriscado. A trilha com progresso e
o projeto individual permanecem candidatos condicionados; quiz/editor ficam
suspensos por evidência ou viabilidade; capacidades periféricas ficam fora por
baixo ganho experimental.

## Rastreabilidade com os critérios de aceite do TCC-10

| Critério de aceite | Atendimento neste documento |
| --- | --- |
| Critérios definidos antes da decisão final | Atendido: a matriz e o procedimento não declaram o recorte vencedor. |
| Coerência com objetivos e dimensões da metodologia | Atendido por I-01, I-05, I-06 e pelas fontes do TCC. |
| Relevância, representatividade, risco e viabilidade considerados | Atendido por I-02, I-04, E-03--E-08 e P-01--P-03. |
| Distinção entre baixo valor e inviabilidade | Atendido pela categorização obrigatória dos motivos de não avanço. |
| Evita recorte trivial e reescrita integral | Atendido pelos critérios de avanço I-02/I-04, por E-04 e pela exigência de fatia vertical. |
| Regras reutilizáveis no texto do TCC | Atendido pela matriz, procedimento, formulário e teste de consistência. |

## Limitações e continuidade

Os critérios foram instanciados em um único estudo de caso e não constituem uma
regra universal de seleção para qualquer sistema web legado. A classificação
dos candidatos continua limitada à base sintética, ao código e aos artefatos
disponíveis nos commits indicados. Dados históricos, novas evidências de
execução ou decisões sobre regras em revisão podem alterar o estado de um
critério, mas devem ser registradas sem reescrever retroativamente a evidência
usada nesta etapa.

A árvore de trabalho consultada do legado contém alterações locais em
documentação, configuração e scripts de reprodução. Elas não foram tratadas
como implementação modernizada nem incorporadas à classificação, que permanece
delimitada ao commit indicado e às evidências documentais identificadas.

O próximo passo é aplicar o formulário aos candidatos que permanecerem
elegíveis, resolver os critérios de avanço obrigatórios e registrar a decisão
final em artefato separado. Somente depois dessa decisão devem ser definidos o
plano de intervenção e a arquitetura necessária à fatia escolhida.
