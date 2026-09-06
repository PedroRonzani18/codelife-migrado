# Web — regras locais

- Código de domínio pertence a `features/<domínio>` ou `modules/<domínio>`;
  `shared` é reservado a infraestrutura ou componentes com pelo menos dois
  consumidores concretos.
- Views compõem hooks, serviços e componentes; não duplicam cliente HTTP ou
  regras de transição do servidor.
- Use os primitivos existentes shadcn/Radix para interação e superfícies quando
  eles se aplicarem. Mantenha HTML semântico (`main`, `section`, headings,
  listas e botões) onde ele expressa a estrutura; não crie wrappers apenas para
  esconder tags HTML.
- Tailwind deve expressar papéis visuais consistentes. Não extraia componentes
  genéricos para uma única tela ou antes de haver reuso comprovado.
- Toda mudança de fluxo preserva foco, teclado, estados de carregamento e erro;
  persistir uma navegação vem antes de refletir a mudança na tela.
- Para mudança de interface execute lint, typecheck, testes e build do web;
  inclua E2E quando rota, sessão, fluxo de jornada ou responsividade mudar.

## Fluxo para novas telas

Antes de editar, identifique a feature dona da tela, o contrato da API, os
estados observáveis e os componentes existentes que podem ser reutilizados.
Use o skill `codelife-frontend-validation` para revisar a tela e o
`codelife-change-contract` para registrar o objetivo e os limites da mudança.

- A página ou rota compõe a feature; hooks, serviços e componentes não devem
  espalhar regra de transição que pertence ao servidor.
- Para uma tela integrada a endpoint, consuma os shapes de
  `packages/contracts`; não recrie tipos de resposta localmente sem decisão
  explícita.
- Modele pelo menos loading, sucesso, erro, vazio e estados de interação
  desabilitada quando forem relevantes ao fluxo.
- Prefira componentes pequenos com responsabilidade clara, mas não extraia
  uma abstração para `shared` antes de existir reuso concreto.
- Considere teclado, foco, semântica, responsividade e recuperação de falhas
  como parte do aceite, não como acabamento posterior.
- Se a validação completa ficar para uma etapa posterior, registre exatamente
  o que foi executado e o que permanece pendente; não trate a tela feliz como
  fluxo concluído.

Leia `.codex/context/current-contract.md` a partir da raiz e o roadmap §6
para alterações na jornada.
