# Comparação de estratégias de modernização aplicáveis ao CodeLife — TCC-9

| Metadado | Valor |
| --- | --- |
| Card | TCC-9 — Comparar estratégias de modernização aplicáveis ao CodeLife |
| Data da análise | 16 de agosto de 2026 |
| TCC consultado | `../TCC`, branch `main`, commit `cfc87f09d20eabcd290e1f988eaaf202c31e12fb` |
| Legado analisado | `../codelife`, commit `9f023a464218155e38de0fa98359236ed062fd5a` |
| Base documental da versão migrada | commit `8b61667c12e119fa1d5c658dca1aa97e853f332a` de `codelife-migrado` |

## Recomendação executiva

A estratégia recomendada é a **modernização incremental por fatias verticais
funcionais**, conduzida com coexistência controlada entre a versão legada e os
incrementos modernizados.

Essa estratégia apresentou o melhor equilíbrio qualitativo entre:

- preservação e validação das regras de negócio;
- geração de incrementos executáveis e demonstráveis;
- delimitação do escopo experimental;
- rastreabilidade entre diagnóstico, intervenção e avaliação;
- repetição de evidências antes/depois em recortes equivalentes;
- isolamento de falhas e possibilidade de retorno ao comportamento legado;
- adequação ao tempo e à finalidade acadêmica do TCC.

A recomendação não significa que uma nova pilha tecnológica seja, por si só,
superior. Ela também não define o recorte final de módulos nem a arquitetura
detalhada da solução. A vantagem decorre da forma de organizar a intervenção:
cada incremento deve atravessar somente as camadas necessárias para entregar e
avaliar um comportamento funcional delimitado.

Há uma condição essencial: uma fatia vertical sem contrato funcional, testes de
caracterização, fronteira de dados e mecanismo de coexistência seria apenas uma
reescrita parcial sem controle. Nesse caso, os benefícios atribuídos à estratégia
deixariam de existir.

## Objetivo, escopo e questão de decisão

O objetivo deste documento é comparar, de forma explícita e rastreável, quatro
estratégias possíveis para atualizar o CodeLife:

1. atualização incremental no sistema existente;
2. reescrita integral;
3. modernização incremental por camadas técnicas;
4. modernização incremental por fatias verticais funcionais.

A questão de decisão é: **qual estratégia oferece o melhor equilíbrio entre
valor experimental, preservação funcional, viabilidade e capacidade de
avaliação no contexto do CodeLife e do TCC?**

Não fazem parte deste documento:

- a arquitetura detalhada da solução modernizada;
- a escolha definitiva de frameworks, bibliotecas ou serviços;
- a implementação de prova de conceito para favorecer uma alternativa;
- a seleção final dos módulos da primeira intervenção;
- estimativas de horas ou datas sem histórico empírico suficiente.

## Método e tratamento das evidências

A comparação foi realizada depois da definição dos critérios e da escala. Não
foi usado somatório simples nem média das notas, porque os critérios não são
intercambiáveis: uma boa capacidade de rollback, por exemplo, não compensa a
perda de regras de negócio, e uma arquitetura tecnicamente limpa não compensa a
ausência de resultado avaliável no prazo do TCC.

Foram empregados quatro tipos de registro:

| Tipo | Significado neste documento |
| --- | --- |
| **Evidência observada** | Resultado presente no código, no histórico, nos relatórios de execução ou nos testes registrados. |
| **Inferência técnica** | Consequência provável apoiada pela combinação de evidências, explicitada como análise e não como fato diretamente medido. |
| **Hipótese** | Possibilidade que depende de decisão ou validação futura. |
| **Limitação** | Lacuna que reduz a segurança ou o alcance da avaliação. |

As avaliações de esforço são relativas entre as quatro estratégias. Não foram
atribuídas horas, prazos ou custos, pois não há dados históricos suficientes
para uma estimativa defensável.

## Síntese do estado que condiciona a decisão

### Estado acadêmico e metodológico

O TCC estabelece seis etapas: diagnosticar o sistema web legado; definir
critérios e métricas; comparar estratégias de atualização; planejar a
intervenção; aplicar a atualização; e avaliar os resultados e discutir a
aplicabilidade. A escolha deste documento corresponde à terceira etapa e deve
usar como entrada o diagnóstico e os critérios já definidos, conforme
[`capitulos/05-andamento.tex`](https://github.com/PedroRonzani18/TCC/blob/cfc87f09d20eabcd290e1f988eaaf202c31e12fb/capitulos/05-andamento.tex).

A contribuição central do trabalho é metodológica. O CodeLife é o estudo de
caso usado para observar a aplicação da proposta. Logo, uma estratégia que
consuma o trabalho em uma reconstrução ampla do produto, sem permitir concluir
a avaliação, entra em conflito com o objetivo acadêmico.

O TCC também exige comparação antes/depois e preservação funcional em conjunto
com métricas técnicas. Uma redução de alertas, complexidade ou vulnerabilidades
não demonstra sucesso se o comportamento do recorte não puder ser reproduzido
e comparado.

### Estado funcional do legado

Os relatórios TCC-3 a TCC-8 mostram que o CodeLife não é apenas uma interface
antiga. Ele incorpora uma jornada educacional composta por hierarquia de ilhas,
níveis e slides, atividades, progresso, produções e interações sociais. Parte
dessas regras está distribuída entre componentes React, rotas Express/Canon,
modelos Sequelize e campos JSON.

As principais evidências funcionais são:

- a relação **ilha → nível → slide** é o núcleo pedagógico mais bem confirmado;
- o progresso mistura identificadores de níveis e ilhas no campo `level` e não
  possui restrições suficientes no banco;
- `completed` não pode ser rebaixado pela rota atual, mas a API não valida
  integralmente existência do item, pré-requisitos ou aprovação;
- quiz e atividade de código expressam intenção bloqueante no código, porém os
  testes manuais registraram avanço indevido;
- editor, prévia e execução dependem de regras serializadas e do sandbox remoto
  `codelife.tech` por `iframe`/`postMessage`;
- projetos, CodeBlocks, colaboração e compartilhamento existem, mas possuem
  falhas observadas e riscos de autorização ou persistência;
- discussões foram confirmadas para slides; não há base para presumir o mesmo
  comportamento em projetos e CodeBlocks;
- CMS, formatos de conteúdo e leitor da trilha compartilham as mesmas entidades
  e representações, o que impede tratar administração e consumo de conteúdo
  como problemas completamente independentes.

Essas conclusões estão detalhadas no
[`inventário funcional`](inventario-funcional-codelife-legado.md), na
[`revalidação de fluxos`](revalidacao-fluxos-regras-negocio-tcc-5.md), no
[`mapa de dependências`](mapa-dependencias-codelife-legado-tcc-6.md) e no
[`catálogo de invariantes`](catalogo-invariantes-funcionais-codelife-tcc-8.md).

### Estado técnico do legado

O ambiente foi reproduzido, mas exigiu Node.js 10.24.1, NPM 6, PostgreSQL 10,
instalação com scripts contornados, reconstrução de dependência nativa, dados
sintéticos, configuração de hosts e scripts auxiliares. Isso confirma que o
estado inicial é observável, mas evidencia barreiras relevantes de manutenção e
reprodutibilidade.

A linha de base formal do TCC registra, no recorte analisado:

- 25.792 linhas no recorte principal contado por `cloc`;
- 23.700 linhas não comentadas analisadas pelo SonarQube;
- complexidade ciclomática de 3.222 e cognitiva de 2.871;
- 359 *code smells* e 544 bugs indicados pela análise estática;
- 506 vulnerabilidades na auditoria de dependências, das quais 26 críticas;
- 56 erros de ESLint;
- `build` com código de saída zero, mas com limitações de minificação;
- ausência de suíte funcional automatizada identificada: o script `test`
  executa ESLint;
- checklist e testes manuais dependentes de base sintética e ambiente local.

Os números são linha de base, não prova isolada de que uma estratégia específica
é correta. Em particular, contagens absolutas não podem ser comparadas sem
controlar tamanho e equivalência do recorte.

### Estado da versão migrada

No commit-base desta análise, `codelife-migrado` contém somente artefatos
documentais dos cards anteriores. Não há aplicação, banco, testes ou incremento
modernizado executável. Portanto:

- nenhuma estratégia possui vantagem já demonstrada por implementação;
- não existe resultado pós-intervenção;
- não se pode afirmar que uma nova stack já resolveu os riscos do legado;
- a decisão deve preservar a possibilidade de criar o primeiro resultado
  executável sem assumir uma reconstrução integral.

## Critérios e escala definidos antes da comparação

### Escala normalizada

Todas as notas são orientadas no mesmo sentido:

| Nota | Interpretação |
| --- | --- |
| **1 — muito desfavorável** | A estratégia tende a comprometer fortemente o critério no contexto observado. |
| **2 — desfavorável** | Há limitações relevantes, mitigáveis apenas com esforço ou risco elevado. |
| **3 — condicional** | Há vantagens e desvantagens equilibradas; o resultado depende de condições ainda não asseguradas. |
| **4 — favorável** | A estratégia oferece boa resposta ao critério, com riscos conhecidos e controláveis. |
| **5 — muito favorável** | O critério é diretamente favorecido pela forma de execução da estratégia. |
| **I — incerto** | Não há evidência suficiente para uma avaliação segura. |

Nos critérios formulados como risco, nota maior significa **melhor capacidade de
reduzir ou controlar o risco**, e não risco maior.

### Definição operacional dos critérios

| ID | Critério | Pergunta usada na comparação |
| --- | --- | --- |
| C1 | Controle do risco de regressão funcional | A estratégia permite limitar e detectar perdas de comportamento? |
| C2 | Preservação e validação de regras de negócio | Regras revalidadas podem virar contratos verificáveis durante a mudança? |
| C3 | Controle de esforço e complexidade | O trabalho pode ser delimitado sem exigir uma frente ampla e simultânea? |
| C4 | Controle do impacto das dependências | Acoplamentos de identidade, conteúdo, progresso, editor e dados podem ser tratados em fronteiras administráveis? |
| C5 | Compatibilidade com a arquitetura e tecnologias legadas | A transição pode reutilizar, adaptar ou conviver com contratos existentes sem ruptura total? |
| C6 | Testabilidade durante a transição | É possível testar cada incremento antes de completar toda a modernização? |
| C7 | Rastreabilidade das mudanças | Cada mudança pode ser ligada a diagnóstico, invariante, risco e evidência? |
| C8 | Resultados intermediários executáveis | A estratégia entrega estados demonstráveis e funcionalmente úteis durante a execução? |
| C9 | Capacidade de medir antes/depois | As evidências podem ser repetidas sobre recortes funcionalmente equivalentes? |
| C10 | Rollback e isolamento de falhas | Uma falha pode ser isolada ou revertida sem comprometer todo o sistema? |
| C11 | Adequação ao prazo e ao escopo do TCC | A estratégia permite concluir intervenção e avaliação dentro de um recorte acadêmico viável? |
| C12 | Controle do risco de virar reimplementação de produto | A estratégia mantém a pesquisa centrada no experimento metodológico? |

### Regra de decisão

A conclusão prioriza quatro propriedades derivadas do objetivo do TCC e do
card: preservação funcional (C1 e C2), valor experimental observável (C6, C8 e
C9), viabilidade acadêmica (C11 e C12) e controle operacional (C4 e C10).

As notas apoiam a leitura, mas não são somadas. A recomendação exige uma
justificativa coerente no conjunto desses critérios e não pode ser obtida por
compensação aritmética entre atributos incompatíveis.

## Estratégias comparadas

### S1 — Atualização incremental no sistema existente

Consiste em manter a aplicação atual como base principal e atualizar runtime,
dependências, componentes e estruturas internas progressivamente, com
refatorações no mesmo sistema.

No CodeLife, essa estratégia preservaria inicialmente Canon, React, Sequelize,
modelos e rotas como centro da aplicação. A evolução precisaria atravessar uma
cadeia tecnológica antiga e integrada: Node 10, dependências antigas de React,
`sharp@0.18`, Electron/Xvfb, build Canon, sandbox remoto e contratos implícitos
de conteúdo.

### S2 — Reescrita integral

Consiste em reconstruir a aplicação em uma base nova e substituir o legado
quando o conjunto considerado necessário estiver pronto.

A separação física favorece isolamento, mas o escopo funcional do CodeLife é
maior do que a trilha principal. Uma reescrita integral exigiria decidir e
reproduzir, adaptar ou excluir identidade, conteúdo, progresso, editor,
produções, colaboração, discussões, CMS, idiomas, moderação, integrações e dados
históricos. A ausência de testes completos torna especialmente arriscado usar o
código novo como única interpretação das regras.

### S3 — Modernização incremental por camadas técnicas

Consiste em modernizar blocos horizontais, por exemplo banco/modelo de dados,
backend/API e frontend, em fases separadas.

Essa decomposição facilita organizar responsabilidades técnicas, mas o CodeLife
possui comportamentos críticos que atravessam todas essas camadas. Modernizar
primeiro o banco exigiria fixar regras ainda ambíguas de progresso e integridade;
modernizar primeiro o backend exigiria manter contratos de cliente antigos;
modernizar primeiro o frontend poderia reproduzir regras frágeis que permanecem
no servidor. O resultado funcional completo tende a aparecer apenas depois que
várias camadas forem tratadas.

### S4 — Modernização incremental por fatias verticais funcionais

Consiste em selecionar um comportamento delimitado e modernizar somente o
conjunto necessário de dados, backend, interface e validações para entregá-lo
de ponta a ponta. As demais funcionalidades continuam atendidas pelo legado ou
permanecem explicitamente fora do incremento.

No CodeLife, os relatórios já fornecem unidades de rastreabilidade para essa
estratégia: fluxos F-01 a F-05, módulos classificados no TCC-7 e invariantes
IF-01 a IF-20. Eles não definem automaticamente a primeira fatia, mas permitem
que uma decisão futura seja transformada em contrato e teste antes da
implementação.

## Matriz comparativa

| Critério | S1 — Atualizar existente | S2 — Reescrita integral | S3 — Por camadas | S4 — Por fatias verticais |
| --- | ---: | ---: | ---: | ---: |
| C1 — Controle de regressão funcional | **2** | **1** | **2** | **4** |
| C2 — Preservação e validação de regras | **3** | **1** | **2** | **5** |
| C3 — Controle de esforço/complexidade | **2** | **1** | **2** | **4** |
| C4 — Controle do impacto das dependências | **1** | **2** | **2** | **4** |
| C5 — Compatibilidade com o legado | **4** | **1** | **3** | **4** |
| C6 — Testabilidade durante a transição | **2** | **3** | **2** | **5** |
| C7 — Rastreabilidade das mudanças | **3** | **2** | **3** | **5** |
| C8 — Resultados intermediários executáveis | **3** | **2** | **2** | **5** |
| C9 — Capacidade de medir antes/depois | **4** | **2** | **3** | **5** |
| C10 — Rollback/isolamento de falhas | **2** | **5** | **3** | **4** |
| C11 — Adequação ao prazo/escopo do TCC | **3** | **1** | **2** | **5** |
| C12 — Controle do risco de reimplementar o produto | **4** | **1** | **3** | **5** |

## Justificativa das avaliações

### S1 — Atualização incremental no sistema existente

**Vantagens no contexto do CodeLife**

- preserva inicialmente a maior parte dos fluxos, dados e contratos existentes;
- facilita executar a linha de base e a intervenção sobre uma mesma aplicação;
- permite correções pequenas e reversíveis quando a dependência alterada possui
  caminho de compatibilidade;
- reduz a necessidade imediata de reconstruir toda a autenticação, o CMS e os
  módulos complementares;
- diminui o risco de a pesquisa assumir formalmente uma reescrita integral.

**Desvantagens no contexto do CodeLife**

- a cadeia tecnológica está atrasada por várias gerações e contém dependências
  nativas, framework integrador e build sensível a versão;
- uma atualização de runtime pode desencadear alterações em Canon, React,
  bundling, imagens e servidor ao mesmo tempo;
- regras e autorização já estão distribuídas entre interface, API e banco, o
  que dificulta corrigir uma camada sem efeitos laterais;
- a ausência de suíte funcional automatizada torna regressões mais difíceis de
  detectar durante atualizações sucessivas;
- problemas funcionais atuais podem ser preservados ou mascarados como
  compatibilidade.

**Riscos principais**

- entrar em uma sequência longa de atualizações intermediárias incompatíveis;
- perder a capacidade de executar a aplicação antes de produzir valor
  experimental mensurável;
- misturar correção funcional, atualização tecnológica e refatoração, reduzindo
  a atribuição causal dos resultados;
- manter acoplamentos e vulnerabilidades porque removê-los exige mudanças
  transversais.

**Leitura da matriz**

A estratégia é forte em compatibilidade inicial e permite comparação técnica
direta, mas é fraca no controle de dependências, na testabilidade e no
isolamento. É plausível para correções pontuais ou contenção de risco, porém não
é a melhor estratégia central para a intervenção experimental.

### S2 — Reescrita integral

**Vantagens no contexto do CodeLife**

- isola o legado e permite manter a versão antiga disponível durante o
  desenvolvimento;
- oferece liberdade para definir testes, modularidade, segurança e automação
  desde o início;
- elimina a obrigação de conduzir toda a cadeia de upgrades tecnológicos;
- apresenta a melhor possibilidade teórica de rollback enquanto a troca final
  não ocorrer, pois o legado permanece separado.

**Desvantagens no contexto do CodeLife**

- amplia o escopo para todos os fluxos considerados necessários ao produto;
- exige reconstruir regras que estão implícitas, divergentes ou não totalmente
  observadas;
- reduz a comparabilidade direta de métricas estruturais entre bases de tamanho
  e arquitetura diferentes;
- posterga a equivalência funcional completa e a avaliação global;
- cria forte risco de o TCC terminar com um produto incompleto e sem repetição
  da linha de base;
- a ausência atual de código no repositório migrado mostra que ainda não existe
  implementação que reduza esse risco.

**Riscos principais**

- omitir regras de negócio não identificadas pelos testes atuais;
- transformar bugs observados em requisitos ou, no extremo oposto, alterar
  regras legítimas sem decisão registrada;
- subestimar identidade, formatos de conteúdo, dados, CMS, sandbox e módulos
  sociais;
- consumir o prazo antes de obter uma versão funcionalmente comparável;
- atribuir melhorias a uma arquitetura nova quando a diferença real decorre de
  redução de escopo.

**Leitura da matriz**

A reescrita integral é favorável em isolamento físico e liberdade de desenho,
mas muito desfavorável nos critérios centrais do TCC: preservação, escopo,
resultado intermediário e comparação equivalente. Não é recomendada.

### S3 — Modernização incremental por camadas técnicas

**Vantagens no contexto do CodeLife**

- organiza a intervenção em fronteiras técnicas reconhecíveis;
- permite especializar decisões de banco, API e interface;
- pode manter contratos temporários entre camada nova e camada antiga;
- facilita medir alguns resultados técnicos específicos por camada;
- evita declarar uma substituição integral de uma única vez.

**Desvantagens no contexto do CodeLife**

- a jornada de aprendizagem e progresso atravessa conteúdo, interface, API,
  identidade e persistência;
- modernizar o modelo de dados antes de decidir `skipped`, unidade de progresso,
  pré-requisitos e unicidade pode cristalizar interpretações erradas;
- modernizar somente a interface tende a manter regras frágeis e autorizações
  incompletas no backend;
- modernizar somente o backend exige adaptar um cliente antigo e pode manter
  estados de interface inconsistentes;
- resultados funcionais e testes ponta a ponta tendem a ser adiados até que
  mais de uma camada esteja concluída.

**Riscos principais**

- produzir camadas tecnicamente modernas, mas sem fluxo utilizável;
- manter por muito tempo adapters e contratos duplicados sem evidência
  funcional de conclusão;
- descobrir tardiamente incompatibilidades que só aparecem na integração;
- avaliar sucesso por métricas internas de uma camada, sem preservação da
  jornada do usuário.

**Leitura da matriz**

A estratégia oferece rastreabilidade técnica razoável e algum isolamento, mas
se ajusta mal ao modo como as regras do CodeLife atravessam camadas. Ela pode
ser usada como técnica interna dentro de uma fatia, mas não é recomendada como
princípio de decomposição principal.

### S4 — Modernização incremental por fatias verticais funcionais

**Vantagens no contexto do CodeLife**

- relaciona diretamente cada mudança a fluxo, invariante e evidência funcional;
- permite entregar incrementos executáveis envolvendo apenas as camadas
  necessárias;
- possibilita escrever testes de caracterização antes da mudança e testes de
  preservação depois dela;
- mantém o legado como referência e fallback para funcionalidades ainda não
  migradas;
- permite excluir explicitamente sandbox, screenshot, social ou CMS quando não
  forem necessários à fatia escolhida, sem alegar modernização integral;
- favorece comparação antes/depois no mesmo recorte funcional;
- limita o crescimento de escopo e produz resultados intermediários úteis para
  a avaliação do TCC;
- usa diretamente os artefatos TCC-3 a TCC-8 como entradas da intervenção.

**Desvantagens no contexto do CodeLife**

- exige definir fronteiras de identidade, dados, roteamento e coexistência;
- pode manter temporariamente duas implementações ou adapters;
- recursos transversais podem aparecer em várias fatias e exigir uma fundação
  mínima comum;
- uma escolha inadequada da primeira fatia pode importar o sandbox, CMS ou
  relações sociais antes de haver evidência suficiente;
- a soma de fatias não garante, por si só, coerência arquitetural futura;
- rollback de dados é mais difícil se houver escrita simultânea sem uma fonte
  de verdade explícita.

**Riscos principais**

- chamar de fatia vertical uma entrega apenas visual ou um CRUD sem regra de
  negócio;
- criar duplicação permanente entre legado e versão nova;
- permitir divergência de dados durante coexistência;
- aumentar escopo da fatia para acomodar todas as dependências encontradas;
- escolher tecnologia antes de decidir contrato, métrica e condição de aceite.

**Leitura da matriz**

É a única estratégia que favorece simultaneamente preservação, testabilidade,
resultado executável, comparabilidade e delimitação acadêmica. Seus riscos são
reais, mas podem ser tratados no planejamento de cada incremento sem exigir a
modernização integral do sistema.

## Comparação de riscos dominantes

| Estratégia | Falha dominante | Consequência para o TCC | Mitigação possível |
| --- | --- | --- | --- |
| S1 — Atualizar existente | Cadeia de upgrades rompe compatibilidade em vários pontos. | Prazo consumido antes de existir intervenção avaliável. | Atualizações pequenas, testes de caracterização e congelamento de recorte; ainda permanece risco alto. |
| S2 — Reescrita integral | Escopo e regras implícitas são subestimados. | Produto incompleto e ausência de comparação pós-intervenção. | Reduzir escopo transforma a estratégia, na prática, em fatias verticais. |
| S3 — Por camadas | Integração funcional é validada tarde. | Camadas prontas sem jornada observável. | Entregar fluxo ponta a ponta a cada fase, o que novamente aproxima a execução de fatias verticais. |
| S4 — Por fatias verticais | A fatia cresce ou não possui contrato verificável. | Incremento deixa de ser isolável e comparável. | Limite explícito, invariantes, testes, fonte de verdade e condição de rollback antes da implementação. |

## Estratégia recomendada e condições de adoção

A modernização incremental por fatias verticais funcionais é recomendada porque
preserva o vínculo entre a finalidade educacional do CodeLife e a intervenção
técnica. Ela permite que a pesquisa observe uma sequência completa em escala
controlada:

```text
evidência do legado
  → regra/invariante decidida
    → cenário de caracterização
      → incremento vertical executável
        → repetição da evidência
          → comparação e limitação registrada
```

A recomendação é válida sob as seguintes condições:

1. **Contrato antes da implementação.** A fatia deve listar invariantes P e A,
   decisões para itens R e exclusões D do catálogo TCC-8.
2. **Caracterização antes da substituição.** Os cenários relevantes devem ser
   executados no legado ou registrados como não observáveis, sem inventar
   resultados esperados.
3. **Resultado ponta a ponta.** A entrega deve incluir as partes de dados,
   backend, interface e teste necessárias ao comportamento escolhido.
4. **Fonte de verdade explícita.** Dados e escrita não podem ficar duplicados
   sem regra de precedência, sincronização e recuperação.
5. **Coexistência delimitada.** Funcionalidades não migradas continuam no
   legado ou ficam fora do recorte, com roteamento e limitações documentados.
6. **Rollback definido antes da mudança.** Código, rota e dados afetados devem
   possuir condição de retorno ou isolamento compatível com o risco.
7. **Métricas equivalentes.** A comparação deve repetir critérios funcionais e
   técnicos sobre o mesmo recorte ou justificar formalmente a equivalência.
8. **Escopo fechado.** Dependências descobertas não entram automaticamente; sua
   inclusão precisa ser necessária ao contrato da fatia.
9. **Tecnologia subordinada à decisão.** NestJS, React, Prisma ou qualquer outra
   escolha deve ser justificada pela execução da fatia, e não usada como motivo
   para selecionar a estratégia.

## Orientação para a etapa seguinte, sem definir o recorte final

A classificação TCC-7 indica que a trilha autenticada com progresso possui alto
valor acadêmico e representatividade técnica, enquanto editor/sandbox e desafio
final concentram risco elevado. O catálogo TCC-8, por sua vez, já separa
comportamentos a preservar, adaptar, descontinuar e revisar.

Essas evidências tornam a jornada pedagógica um **candidato a ser examinado na
seleção de recorte**, mas este documento não a declara como recorte final. A
decisão posterior ainda deve resolver, no mínimo:

- política de acesso e desbloqueio de ilhas e níveis;
- unidade e estados de progresso, inclusive o significado de `skipped`;
- critérios de aprovação de quiz e de atividade de código, se incluídos;
- fronteira de identidade e autorização;
- forma de leitura ou conversão do conteúdo legado;
- itens explicitamente excluídos da comparação de preservação.

Uma alternativa de menor risco, como leitura estruturada de conteúdo, pode ser
útil como incremento preparatório, mas isoladamente tem menor valor experimental
porque não exercita persistência de progresso. A seleção final deve equilibrar
representatividade e capacidade real de conclusão, usando a matriz TCC-7 e as
decisões pendentes do catálogo TCC-8.

## Limitações da avaliação

1. A análise utiliza um único sistema web legado e não permite generalização
   universal da estratégia recomendada.
2. A base funcional é sintética e não representa dados de produção.
3. Os portais públicos e os serviços externos não constituíram ambiente de
   produção observável.
4. A árvore de trabalho do legado contém alterações locais em documentação e
   scripts de reprodução. A evidência de código foi delimitada ao commit
   `9f023a4`; essas alterações locais não são tratadas como modernização.
5. O TCC registra uma linha de base formal e os relatórios posteriores registram
   revalidações estáticas e testes históricos adicionais. Diferenças de recorte
   ou momento de coleta devem ser preservadas na comparação futura.
6. Não há implementação modernizada, teste pós-intervenção ou arquitetura alvo
   que permita avaliar esforço real de integração.
7. Não foi inspecionada uma base histórica de produção; constraints e qualidade
   de dados reais podem alterar o risco de migração.
8. As notas são avaliações qualitativas relativas. Elas não equivalem a prazo,
   custo ou probabilidade estatística.
9. O bom isolamento teórico da reescrita integral depende de manter o legado
   executável; uma substituição abrupta eliminaria esse benefício.
10. Fatias verticais podem acumular dívida de transição. A recomendação não
    garante automaticamente uma arquitetura final coerente.

## Rastreabilidade com os critérios de aceite do TCC-9

| Critério de aceite | Atendimento neste documento |
| --- | --- |
| Quatro estratégias mínimas analisadas | Atendido nas seções S1 a S4 e na matriz comparativa. |
| Critérios definidos antes da conclusão | Atendido na seção de critérios, escala e regra de decisão. |
| Evidências específicas do CodeLife | Atendido com TCC, relatórios TCC-3 a TCC-8, código legado, linha de base e testes registrados. |
| Benefícios e limitações de todas as alternativas | Atendido nas justificativas individuais. |
| Estratégia escolhida com justificativa rastreável | Atendido pela matriz, riscos dominantes e condições de adoção. |
| Decisão independente de familiaridade tecnológica | Atendido: a recomendação é funcional/metodológica e subordina a stack ao contrato. |
| Resultado reutilizável no planejamento e no TCC | Atendido: critérios, matriz, conclusão, limitações e orientação de continuidade estão registrados. |

## Fontes locais principais

- [`Metodologia proposta no TCC`](https://github.com/PedroRonzani18/TCC/blob/cfc87f09d20eabcd290e1f988eaaf202c31e12fb/capitulos/05-andamento.tex)
- [`Aplicação experimental e linha de base`](https://github.com/PedroRonzani18/TCC/blob/cfc87f09d20eabcd290e1f988eaaf202c31e12fb/capitulos/06-aplicacao-experimental.tex)
- [`Avaliação, limitações e conclusões`](https://github.com/PedroRonzani18/TCC/blob/cfc87f09d20eabcd290e1f988eaaf202c31e12fb/capitulos/07-conclusoes.tex)
- [`Inventário funcional — TCC-3`](inventario-funcional-codelife-legado.md)
- [`Modelo de dados — TCC-4`](relatorio-revalidacao-modelo-dados-legado-tcc-4.md)
- [`Fluxos e regras — TCC-5`](revalidacao-fluxos-regras-negocio-tcc-5.md)
- [`Mapa de dependências — TCC-6`](mapa-dependencias-codelife-legado-tcc-6.md)
- [`Classificação de módulos — TCC-7`](matriz-classificacao-modulos-fluxos-codelife-tcc-7.md)
- [`Catálogo de invariantes — TCC-8`](catalogo-invariantes-funcionais-codelife-tcc-8.md)
- [`Diagnóstico da base sintética`](https://github.com/PedroRonzani18/codelife/blob/9f023a464218155e38de0fa98359236ed062fd5a/docs/diagnostico-base-funcional.md)
- [`Resultados dos testes funcionais`](https://github.com/PedroRonzani18/codelife/blob/9f023a464218155e38de0fa98359236ed062fd5a/docs/resultados-testes-funcionais-codelife.md)

## Conclusão

A hipótese do card foi **confirmada com condições**. A modernização incremental
por fatias verticais funcionais é a alternativa mais coerente com o estado do
CodeLife e com a finalidade metodológica do TCC porque permite controlar escopo,
entregar comportamento executável, preservar regras e produzir comparação
antes/depois. Atualização no sistema existente pode servir para contenções ou
ajustes pontuais; modernização por camadas pode ser uma técnica interna de uma
fatia; e reescrita integral deve ser rejeitada como estratégia principal do
experimento.

A escolha não encerra a decisão de engenharia. Ela estabelece a forma pela qual
o próximo recorte deve ser selecionado e planejado: a partir de invariantes,
dependências, testes, métricas, limites e rollback explícitos, e não a partir da
preferência por uma stack moderna.
