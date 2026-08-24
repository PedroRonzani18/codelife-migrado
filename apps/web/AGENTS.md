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

Leia `.codex/context/current-contract.md` a partir da raiz e o roadmap §6
para alterações na jornada.
