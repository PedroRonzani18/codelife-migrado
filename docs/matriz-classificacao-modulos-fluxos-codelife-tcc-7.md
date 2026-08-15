# Matriz de classificação de módulos e fluxos do CodeLife legado — TCC-7

**Card:** TCC-7 — Classificar módulos por relevância, complexidade, risco e dependências
**Data da análise:** 14 de agosto de 2026
**Repositório analisado:** `../codelife`, commit `9f023a464218155e38de0fa98359236ed062fd5a`
**Objetivo:** comparar os módulos e fluxos revalidados do CodeLife para apoiar, em etapa posterior, a definição de um recorte experimental de modernização que seja funcionalmente representativo e executável.

## Escopo, fontes e limites

Esta classificação usa as evidências já reconstruídas nos cards TCC-3, TCC-4, TCC-5 e TCC-6, complementadas pelo enquadramento acadêmico disponível no repositório do TCC. Ela não inspeciona novamente nem altera o legado, a versão migrada ou o texto do TCC.

Fontes principais:

- [Inventário funcional revalidado (TCC-3)](inventario-funcional-codelife-legado.md), para finalidade, implementação e divergências dos módulos;
- [Relatório de modelo de dados (TCC-4)](relatorio-revalidacao-modelo-dados-legado-tcc-4.md), para entidades, regras implícitas e ausência de *constraints*;
- [Revalidação de fluxos e regras (TCC-5)](revalidacao-fluxos-regras-negocio-tcc-5.md), para invariantes candidatas e resultados observados na base sintética;
- [Mapa de dependências (TCC-6)](mapa-dependencias-codelife-legado-tcc-6.md), para acoplamentos, integrações e fatias verticais possíveis;
- `../TCC/capitulos/05-andamento.tex`, `06-aplicacao-experimental.tex` e `07-conclusoes.tex`, para preservar o papel do CodeLife como estudo de caso e a separação entre diagnóstico, escolha de estratégia, planejamento, aplicação e avaliação.

As evidências estáticas confirmam que código, rotas, modelos e contratos estão presentes no commit analisado. Elas não demonstram operação atual de portais, DNS, credenciais, serviços remotos ou dados históricos. Resultados de testes funcionais referem-se a uma base sintética e distinguem falha observada, ausência de validação e inexistência de funcionalidade. Por isso, uma falha observada eleva o risco e demanda teste de caracterização; ela não é tratada automaticamente como requisito a preservar ou como prova de que o fluxo não existe.

Este documento **não** escolhe definitivamente o recorte, não define a stack alvo, não estima horas e não implementa módulos. As recomendações são preliminares e servem para comparar alternativas na etapa seguinte.

## Critérios e escala de classificação

As classificações são qualitativas. Elas evitam somas e pontuações artificiais: um módulo não é mais adequado apenas por reunir mais atributos altos. A decisão posterior deve considerar a combinação entre valor acadêmico, evidência disponível, riscos e viabilidade de uma fatia vertical coerente.

| Critério | Baixa | Média | Alta |
| --- | --- | --- | --- |
| **Relevância funcional** | Capacidade histórica, periférica ou não necessária aos fluxos centrais. | Apoia a experiência, mas sua ausência não descaracteriza o núcleo pedagógico. | Participa diretamente da proposta educacional, da jornada principal ou da preservação funcional central. |
| **Representatividade técnica** | Cobre principalmente uma camada ou uma apresentação isolada. | Exercita mais de uma camada, mas com persistência, regras ou integração pouco representativas. | Exercita interface, lógica de servidor, persistência e/ou integração de modo suficiente para avaliar atributos técnicos no recorte. |
| **Complexidade** | Poucos componentes, estados e relacionamentos. | Componentes e dados variados, mas com fronteira funcional identificável. | Muitos componentes, regras/estados, formatos de dados ou esforço de integração coordenado. |
| **Risco** | Regras e dependências conhecidas, sem falha material registrada. | Há incerteza, dependência complementar ou validação parcial. | Há integração externa frágil, regra ambígua, autorização/integridade insuficiente ou falha observada que pode comprometer o fluxo. |
| **Grau de dependência** | Pode ser adiado sem interromper o núcleo e consome poucos recursos compartilhados. | Depende de recursos transversais, mas pode ser separado por contrato. | Exige tratar conjuntamente identidade, conteúdo, progresso, editor, formatos ou outras dependências do núcleo. |
| **Possibilidade de isolamento** | Não há fronteira útil sem reestruturar vários módulos. | Há uma fatia viável, desde que dependências explícitas sejam incluídas ou adaptadas. | Possui contrato e dados próprios suficientes para uma fatia vertical com poucas dependências obrigatórias. |

Na coluna de recomendação, **forte candidato** significa uma alternativa que deve seguir para comparação de estratégias, e não uma aprovação automática. **Candidato complementar** indica capacidade que pode ampliar uma fatia principal depois que suas pré-condições forem estabelecidas. **Baixo valor para o recorte inicial** indica que o risco ou o acoplamento supera a evidência adicional esperada para uma primeira intervenção. **Fora do recorte** aplica-se a capacidades desativadas, históricas ou não necessárias sem uma decisão posterior específica.

## Dependências transversais que condicionam a classificação

| Recurso compartilhado | Módulos afetados | Efeito na escolha do recorte |
| --- | --- | --- |
| Identidade, sessão, `userprofiles` e papéis | Progresso, projetos, colaboração, discussões, busca, perfil e CMS | Qualquer fatia autenticada precisa definir autorização no servidor; guardas de interface do legado não são suficientes. |
| Hierarquia `islands → levels → slides` e formatos de conteúdo | Trilha, atividades, progresso, desafio final, discussões e CMS | Ordem, HTML, `quizjson`, `rulejson` e campos de idioma formam contratos de conteúdo que não podem ser alterados isoladamente. |
| `userprogress` | Mapa, aula, desbloqueio, desafio final, ranking e continuidade | O campo `level` armazena identificadores de nível e ilha, sem FK ou unicidade composta; a unidade de progresso e `skipped` precisam ser definidas antes de converter dados. |
| `CodeEditor` e sandbox | Exercícios de código, projetos, CodeBlocks e visualização | Edição, prévia, execução, `postMessage` e captura de imagem não devem ser tratados como um único requisito técnico. |
| Visibilidade, status, likes e reports | Produções, discussões, perfil, cards e administração | Relações polimórficas e regras de moderação exigem contrato explícito se entrarem no escopo. |
| Idioma, host e armazenamento de arquivos | Conteúdo, perfil, CMS, sandbox e compartilhamento | São condicionantes de infraestrutura e dados, mas não devem ampliar uma fatia funcional sem necessidade. |

## Matriz de classificação

| Módulo ou fluxo candidato | Finalidade | Relevância funcional | Representatividade técnica | Complexidade | Risco | Dependências | Isolamento | Evidência e adequação ao recorte | Recomendação preliminar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Autenticação, perfil e papéis | Identificar a pessoa usuária e controlar acesso a capacidades autenticadas e administrativas. | Alta | Alta | Média | Alta | Alta | Média | É transversal e necessário para qualquer fatia autenticada. O legado concentra parte da proteção no cliente e algumas rotas não reforçam autoria. Deve ser uma pré-condição do recorte, não um objetivo isolado. | Candidato complementar (fundacional) |
| Leitura estruturada de conteúdo | Apresentar ilha, nível e slide, com ordenação, conteúdo e idioma. | Alta | Média | Média | Média | Alta | Média | Representa o núcleo pedagógico, mas, sem progresso ou atividade, cobre principalmente leitura. É uma fronteira útil para entender e converter conteúdo, não uma reprodução completa da jornada. | Candidato complementar |
| Trilha autenticada com progresso | Navegar por ilhas, níveis e slides, registrar conclusão e liberar continuidade. | Alta | Alta | Alta | Alta | Alta | Média | Combina interface, API, persistência, estado e regras pedagógicas, oferecendo alto valor acadêmico. A viabilidade depende de definir granularidade, pré-requisitos e semântica de `completed`/`skipped` antes da intervenção. | **Forte candidato**, condicionado à caracterização do progresso |
| Quiz e atividade bloqueante | Avaliar resposta/código e controlar avanço na aula. | Alta | Alta | Alta | Alta | Alta | Baixa | A intenção de bloqueio está no código, mas os testes T04 e T05 registraram avanço indevido. Requer decidir regras esperadas e separar quiz, validação local e execução antes de preservá-las. | Candidato complementar |
| Editor, prévia e validação de código | Editar HTML/JavaScript, mostrar prévia, aplicar regras e executar código. | Alta | Alta | Alta | Alta | Alta | Baixa | É tecnicamente rico, mas depende de `codelife.tech`, `postMessage`, iframe e regras serializadas; T05/T06 observaram falhas na prévia e validação. A evidência atual não sustenta usá-lo como primeiro recorte sem investigação adicional. | Baixo valor para o recorte inicial |
| Desafio final e CodeBlock | Submeter produção vinculada à ilha e, se aprovada, concluir a ilha. | Alta | Alta | Alta | Alta | Alta | Baixa | Forma uma extensão coesa da trilha, mas herda os riscos do editor, do sandbox, da persistência de CodeBlocks e da semântica de progresso. A unicidade por estudante/ilha não é garantida. | Baixo valor para o recorte inicial |
| Projeto individual | Criar, editar, recuperar e consultar produção própria. | Média | Alta | Média | Alta | Média | Média | É uma fatia de CRUD com autoria, persistência e interface, potencialmente útil para avaliar modernização sem incluir colaboração. T08 observou persistência incompleta e o editor é compartilhado; a prévia e screenshot devem ficar explícitos como opcionais. | Candidato complementar, condicionado a testes de caracterização |
| Colaboração em projetos | Permitir acesso de colaboradoras(es) e gestão da relação N:M em projetos. | Média | Alta | Alta | Alta | Alta | Baixa | Amplia o projeto individual com identidade, autorização e integridade do vínculo. Não há garantia física de unicidade e as rotas não confirmam que só a pessoa proprietária administra colaboradores. | Baixo valor para o recorte inicial |
| Discussões de slides | Criar threads e comentários vinculados a slides. | Média | Alta | Média | Média | Média | Média | Exercita sessão, APIs, persistência, autoria e estado sem depender do sandbox. O escopo atual é somente `slide`; likes, denúncias e painel de moderação podem ser postergados. É adequado como complemento de uma fatia da trilha. | Candidato complementar |
| Busca, perfil e navegação complementar | Localizar pessoas/projetos, consultar perfis e apoiar descoberta de conteúdo. | Média | Média | Média | Média | Média | Média | Possui fronteira relativamente clara, mas não é central para a jornada pedagógica. Busca exige sessão e perfil completo não é público; privacidade deve ser reavaliada antes de manter consultas e campos atuais. | Candidato complementar |
| CMS de conteúdo e glossário | Criar, editar, ordenar e publicar ilhas, níveis, slides, regras e glossário. | Alta | Alta | Alta | Alta | Alta | Baixa | Escreve os mesmos formatos e entidades consumidos pela trilha. É importante para compatibilidade de conteúdo, mas pode ser planejado após definir e validar o leitor e o contrato de migração. | Candidato complementar |
| Internacionalização, subdomínios e mídia | Escolher idioma, redirecionar por host e armazenar imagens/capturas. | Média | Média | Média | Média | Média | Média | A lógica PT/EN e os arquivos locais são relevantes para dados e operação, mas não definem sozinhos o comportamento central. DNS e hospedagem não foram verificados. | Candidato complementar (restrição transversal) |
| Compartilhamento social, ranking e moderação | Expor produções, registrar likes/denúncias e operar visibilidade/destaque. | Baixa | Alta | Alta | Alta | Média | Baixa | Não é necessário para a preservação inicial da trilha ou do CRUD básico. Usa relações polimórficas, limites de denúncia e infraestrutura de screenshot/notificação que ampliam o risco. | Fora do recorte inicial |
| Concurso, pesquisa e estruturas históricas | Suportar concurso, pesquisa beta e configurações/estruturas antigas. | Baixa | Baixa | Média | Média | Baixa | Alta | Rotas ou modelos permanecem no código, mas concurso e pesquisa estão desativados/depreciados e `searches`/`siteconfigs` não têm fluxo ativo confirmado. | Fora do recorte |

## Leitura comparativa das alternativas

A matriz evidencia três conclusões que devem orientar a próxima decisão:

1. **A trilha autenticada com progresso é a alternativa de maior valor acadêmico.** Ela preserva a finalidade educacional e envolve interface, regras, API e persistência. Seu risco não recomenda descartá-la; recomenda reduzir incerteza antes de implementá-la, especialmente sobre a unidade de progresso, estados aceitos, pré-requisitos e autorização.
2. **Editor, sandbox, atividade de código e desafio final concentram o maior risco.** Eles são relevantes para o CodeLife, mas as falhas observadas e a integração externa tornam inadequado presumir que uma primeira intervenção deva incluí-los. Caso sejam comparados como opção, devem constituir uma alternativa própria com testes de caracterização e contrato de execução segura.
3. **Discussões de slides e projeto individual são complementos tecnicamente representativos.** Cada um acrescenta persistência e autorização sem ampliar a fatia principal para toda a infraestrutura social. Projeto individual requer retestar persistência; discussões devem continuar limitadas a slides enquanto não houver evidência para outros alvos.

Em consequência, a classificação não favorece a escolha de uma tela isolada somente por ser simples. A leitura de conteúdo sem estado tem baixo risco, mas não demonstra integralmente preservação de jornada, regras e persistência. Do mesmo modo, módulos centrais com risco alto — em especial trilha e progresso — permanecem candidatos quando acompanhados de pré-condições explícitas.

## Pré-condições e evidências exigidas antes da escolha final

| Alternativa | Pré-condições para avançar à comparação de estratégias | Evidências mínimas a produzir |
| --- | --- | --- |
| Trilha autenticada com progresso | Definir unidade de progresso, política de `skipped`, pré-requisitos, autorização e migração de conteúdo/ordenação. | Casos de caracterização para navegação, desbloqueio e persistência; mapeamento de `userprogress`; contrato de conteúdo ilha–nível–slide. |
| Atividades de quiz/código | Separar regra de negócio de UI, definir aprovação e distinguir validação local, prévia e execução remota. | Casos para resposta errada/correta, bloqueio, feedback e restauração; decisão documentada sobre sandbox. |
| Projeto individual | Definir autoria, visibilidade e comportamento de persistência independente de preview/screenshot. | Reteste de criar, editar e recuperar; contrato de autorização no servidor; evidência de armazenamento mínimo. |
| Discussões de slides | Confirmar regra de autoria/status e manter o alvo limitado a `slide`. | Casos de criar thread/comentário, consultar por slide e aplicar regras de acesso. |
| CMS | Estabilizar representação que o leitor consome antes de migrar o editor administrativo. | Inventário de HTML/JSON, ordenação e variantes de idioma; teste de leitura para conteúdo convertido. |

## Rastreabilidade dos critérios de aceite do card

| Critério de aceite | Atendimento neste estudo |
| --- | --- |
| Todos os módulos relevantes identificados no diagnóstico foram considerados. | Atendido: os oito eixos do inventário, recursos transversais e capacidades descobertas/desativadas foram classificados ou explicitamente excluídos. |
| Critérios possuem definição explícita e consistente. | Atendido: a escala qualitativa define relevância, representatividade, complexidade, risco, dependências e isolamento antes da matriz. |
| Classificação é sustentada por evidências, não por preferência pessoal. | Atendido: cada linha relaciona a recomendação a documentos TCC-3 a TCC-6 e às limitações registradas no TCC. |
| Módulos centrais, mas arriscados, não são descartados sem justificativa. | Atendido: trilha e progresso permanecem forte candidato; editor e desafio final são postergados por integrações e falhas específicas documentadas. |
| Matriz permite comparar alternativas de recorte. | Atendido: a matriz e a seção de leitura comparativa distinguem fatias principais, complementares e itens fora do recorte. |
| Classificação considera valor acadêmico e viabilidade de execução. | Atendido: relevância/representatividade são avaliadas junto de complexidade, risco, dependências e isolamento. |

## Resultado para a continuidade do TCC

O diagnóstico fornece evidência suficiente para iniciar a comparação de estratégias e a discussão de recorte, mas não para declarar uma escolha definitiva. A próxima etapa deve comparar alternativas que preservem uma fatia vertical da jornada pedagógica, registrar o tratamento das pré-condições desta matriz e justificar por que as integrações de maior risco entram ou ficam fora da primeira intervenção. A contribuição central permanece metodológica: o CodeLife é o estudo de caso usado para aplicar e avaliar as decisões, não a contribuição isolada do trabalho.
