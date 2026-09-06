---
name: codelife-frontend-validation
description: Implementar ou revisar telas e fluxos React do CodeLife migrado, verificando composição por feature, contratos, estados de interface, acessibilidade, responsividade e integração com a API.
---

# Validação de frontend

Use este skill quando uma tarefa criar ou alterar uma tela, rota, fluxo de
interação, componente de domínio ou integração do web com a API.

O objetivo é validar o fluxo observável e a estrutura da feature. Este skill
não transforma uma tela específica em componente genérico nem inventa regras de
produto que não estejam no contrato.

## Leitura mínima

1. Leia `AGENTS.md`, `.codex/context/current-contract.md` e
   `.codex/context/decision-index.md`.
2. Leia `apps/web/AGENTS.md` e `packages/contracts/AGENTS.md`.
3. Leia o ADR ou trecho do roadmap indicado para a jornada afetada.
4. Inspecione a rota, feature, hooks, serviços, componentes e testes existentes
   mais próximos antes de criar uma nova estrutura.
5. Verifique `git status --short --branch` e preserve alterações locais.

## Contrato da tela

Antes de editar, declare:

- objetivo observável da tela ou fluxo;
- rota e ponto de entrada;
- dados necessários e endpoint correspondente;
- estados de loading, sucesso, erro, vazio e desabilitado;
- ações permitidas e transições esperadas;
- componentes existentes que serão reutilizados;
- fora de escopo e validações que ficarão pendentes.

Se o comportamento depender de uma regra de negócio não confirmada, pare no
planejamento e peça direção em vez de decidir pela aparência da interface.

## Organização da implementação

- Mantenha código de domínio em `features/<domínio>` ou `modules/<domínio>`.
- Use `shared` apenas para infraestrutura ou componentes com pelo menos dois
  consumidores concretos.
- Faça a rota ou página compor a feature; não concentre toda a lógica em um
  componente de tela grande.
- Separe apresentação, estado da tela, integração HTTP e componentes quando
  houver responsabilidades distintas reais.
- Consuma os shapes de `packages/contracts`; não duplique tipos de resposta ou
  regras de transição no frontend.
- Reutilize os primitivos shadcn/Radix existentes quando forem adequados.
- Preserve a semântica HTML e não use wrappers genéricos apenas para esconder
  elementos semânticos.

## Checklist de comportamento

Verifique, conforme aplicável:

- a tela renderiza o estado inicial e o loading sem informação enganosa;
- sucesso, vazio e erro são distinguíveis e recuperáveis;
- ações ficam desabilitadas durante operações incompatíveis;
- falhas de persistência permanecem explícitas;
- foco, teclado, headings, labels e semântica estão preservados;
- layout e conteúdo continuam utilizáveis em larguras relevantes;
- a navegação só reflete uma transição persistida quando essa for a regra do
  fluxo;
- o contrato usado pelo frontend corresponde ao endpoint real;
- nenhum componente foi movido para `shared` sem reuso comprovado.

## Validação proporcional

Durante a implementação, priorize inspeção do fluxo afetado e verificações
rápidas. Ao fechar uma fatia:

- mudança de componente ou tela: `pnpm --filter web lint`, typecheck, testes e
  build;
- mudança de rota, sessão, jornada ou responsividade: inclua E2E;
- mudança de contrato: valide API e web coordenadamente;
- validação visual manual: registre o cenário, viewport e resultado, sem
  apresentá-la como teste automatizado.

Se a validação completa ficar para depois, registre o que foi executado, o que
ficou pendente e qual risco permanece. Não considere o caminho feliz isolado
como validação suficiente.

## Encerramento

Relate:

- rota, feature e componentes alterados;
- estados e comportamentos entregues;
- contrato e endpoint consumidos;
- validações executadas e pendentes;
- problemas de acessibilidade, responsividade ou integração;
- riscos residuais e decisões que precisam de confirmação.

Não faça commit, push, Pull Request ou publicação sem autorização explícita.
