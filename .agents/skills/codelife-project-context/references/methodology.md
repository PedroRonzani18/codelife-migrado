# Metodologia operacional do TCC

## Fonte e precedência

A fonte primária disponível no checkout irmão é
`../TCC/capitulos/05-andamento.tex`. Os documentos locais
`docs/comparacao-estrategias-modernizacao-codelife-tcc-9.md`,
`docs/criterios-inclusao-exclusao-recorte-codelife-tcc-10.md`,
`docs/decisao-recorte-experimental-codelife-tcc-11.md` e as evidências do
recorte servem como apoio reproduzido. Se a fonte primária não estiver
acessível, declare a limitação e use apenas o material local verificável.

A proposta possui seis etapas: diagnosticar o legado; definir critérios e
medidas; comparar estratégias; planejar a intervenção; aplicar a atualização; e
avaliar resultados e discutir aplicabilidade. As três primeiras são orientação
global. Planejamento, aplicação e avaliação formam um ciclo por incremento; a
decisão de continuidade não é uma sétima etapa.

## Etapa 4 — planejar a intervenção

Entradas: estratégia escolhida, recorte do incremento, riscos, restrições e
critérios de avaliação. O resultado mínimo é um plano funcional e técnico
rastreável, executável e compatível com o escopo.

O plano deve conectar, sem substituir o diagnóstico:

- comportamento e contrato funcional a preservar ou adaptar;
- linha de base específica do incremento;
- arquitetura e fronteiras afetadas;
- escolhas técnicas como meios contextualizados, não como prescrição geral;
- persistência, integrações, ambiente, tarefas e ordem de execução;
- riscos, critérios de sucesso, validações e evidências esperadas;
- escopo, fora do escopo e condição de continuidade/retorno quando aplicável.

Não avance para aplicação com um design técnico isolado ou uma arquitetura
escolhida apenas por preferência tecnológica. O plano precisa ser justificado
pelo diagnóstico, critérios, estratégia e restrições reais.

## Etapa 6 — avaliar e discutir aplicabilidade

Entradas: linha de base e versão atualizada. Repita a coleta de forma
disciplinada, compare comportamentos e medidas equivalentes, verifique
preservação funcional, registre regressões e discuta limitações. O resultado
mínimo é uma análise antes/depois, discussão de aplicabilidade e decisão de
continuidade registrada.

Antes de interpretar, classifique o alcance da comparação. Use preservação,
adaptação deliberada, regressão, não comparável ou não coletável quando essas
categorias forem pertinentes. Uma evidência contextual de execução não deve ser
promovida a melhoria comparativa sem instrumento equivalente no legado.

As sete dimensões gerais são preservação/adequação funcional, manutenibilidade
e qualidade interna, testabilidade/verificação automatizada, segurança e
terceiros, confiabilidade/estabilidade, compatibilidade/integrações e
reprodutibilidade/implantação/portabilidade. Se uma migração exigir dimensão
adicional, fundamente sua relevância e viabilidade; não invente métricas.

A cadência pode ser por incremento, por marco ou consolidada no encerramento.
Declare a cadência e as limitações antes de coletar. A aplicação de uma única
fatia do CodeLife não autoriza alegação de modernização integral ou validação
universal da metodologia.
