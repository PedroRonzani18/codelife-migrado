# Contrato operacional atual — CodeLife migrado

## Estado

- Card vigente: TCC-30.
- Recorte: jornada autenticada da `island-3`, com três níveis e nove slides.
- Autenticação Google real concluída; `ExternalIdentity` existente, sessão local
  JWT + cookie HttpOnly preservada e usuário persistido usado pelo progresso.
- Incremento atual: gestão mínima de usuários e autorização, com infraestrutura
  RBAC declarativa no backend e endpoints administrativos de listagem e alteração
  de papel, sem UI administrativa.
- Papéis deste incremento: `USER | ADMIN`; autorização usa o papel persistido,
  sem role no JWT.
- Papel acadêmico: produzir evidência técnica delimitada para o TCC; não
  modernizar o CodeLife inteiro nem alegar eficácia pedagógica ou validação
  universal.

## Invariantes que não podem mudar por acidente

- Conteúdo: `Island → Level → Slide`, com UUID público e ordenação por
  `position`; não introduzir reutilização de conteúdo, trilha ou listas
  ligadas sem decisão nova.
- Progresso: `UserIslandProgress → UserLevelProgress`; cursor atual no nível;
  estados derivados, nunca enviados pelo cliente.
- Comandos: iniciar, navegar e concluir são comandos idempotentes; leitura não
  cria progresso; conclusão só ocorre no último slide.
- Persistência: FKs `RESTRICT`; migration falha diante de progresso ou contexto
  ambíguo; seed é idempotente e preserva progresso existente.
- Contratos: Zod por domínio, sem Prisma, Nest, React ou detalhes de banco.
- API: regras no service; controller adapta HTTP; repository Prisma fica atrás
  de port tipado quando for uma fronteira consumida por service.
- Web: módulos são donos de seu domínio; `shared` só recebe código com reuso
  comprovado; tags HTML semânticas são permitidas e preferíveis a wrappers sem
  significado.

## Convenções de UX já acordadas

- A pessoa escolhe iniciar o nível na visão da ilha; após essa ação, o início
  persistido ocorre silenciosamente, sem modal de confirmação.
- Ao concluir um nível não final, a ação principal é seguir para o próximo
  nível. No último nível, a ação principal é finalizar a ilha e retornar à
  visão consolidada.
- Falhas de persistência devem continuar explícitas e recuperáveis.

## Manutenção deste documento

Atualize este resumo apenas quando uma decisão alterar o contrato vigente.
Registre a decisão completa no ADR ou roadmap apropriado e inclua o vínculo em
`decision-index.md`; este arquivo não substitui as fontes canônicas.
