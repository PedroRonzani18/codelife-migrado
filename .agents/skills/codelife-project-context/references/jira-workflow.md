# Jira e rastreabilidade

## Entrada e acesso

O card Jira da intervenção é entrada essencial do Planner. Aceite a URL ou ID
fornecido pelo usuário e não invente um identificador. Se um conector ou acesso
autenticado estiver disponível, analise o card, descrição, critérios,
comentários, links, parent/épico, cards relacionados, dependências e decisões.

Se Jira não estiver disponível ou o acesso falhar, não finja leitura. Peça o
conteúdo exportado/colado ou registre a limitação antes do planejamento
substantivo. O planejamento pode continuar somente com contexto equivalente
explicitamente fornecido e deve identificar a fonte usada.

## O que registrar

No `migration-plan.md`, mantenha a relação entre:

- card da intervenção, épico/parent e cards de implementação/validação quando
  existirem;
- comportamento ou problema do card;
- decisões `DEC-*`, critérios de aceite, macroetapas e evidências;
- pendências, riscos e decisão de continuidade.

Não transforme um comentário Jira em regra de produto sem confirmar seu escopo
e sua precedência. Não atualize Jira durante este workflow sem pedido explícito.

## Texto Jira-ready

Quando solicitado, o Validator pode produzir um resumo com escopo validado,
validação funcional, smoke tests, testes automatizados, build/qualidade,
avaliação comparativa, evidências, ressalvas e resultado. O texto deve separar
fato executado, limitação e inferência metodológica.
