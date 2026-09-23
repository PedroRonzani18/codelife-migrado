# Contrato operacional atual — CodeLife migrado

## Estado

- Card vigente: TCC-32 / TCC-33 / TCC-34 (Épico TCC-19).
- Recorte: Administração de conteúdo hierárquico (`Island → Level → Slide`), catálogo sequencial de ilhas (`/ilhas`), suporte a três tipos de slide (`TextText`, `TextImage`, `TextCode`), upload de mídia com normalização WebP e proteção progress-aware de reordenação/exclusão.
- Autenticação e papéis: Google real / experimental; sessão JWT + cookie HttpOnly; papéis persistidos `USER | ADMIN`.
- Rotas administrativas: `/admin/users` (gestão de papéis) e `/admin/content` (árvore editorial de conteúdo). Acesso restrito a `ADMIN`; `USER` é redirecionado para `/ilhas`.
- Catálogo e navegação de aprendizado: a rota raiz autenticada `/` conduz a `/ilhas`. O catálogo expõe ilhas publicadas em ordem sequencial de `position` com estados de disponibilidade derivados (`available`, `in_progress`, `completed`, `blocked`).
- Acesso bloqueado: tentativa de acesso direto a ilha bloqueada retorna `403` (`ISLAND_BLOCKED`) e a interface oferece ação de retorno a `/ilhas`.
- Papel acadêmico: produzir evidência técnica delimitada para o TCC; não modernizar o CodeLife inteiro nem alegar eficácia pedagógica ou validação universal.

## Invariantes que não podem mudar por acidente

- Conteúdo: `Island → Level → Slide`, com UUID público e ordenação por `position` positiva e única; estado editorial derivado de `publishedAt DateTime?` em Island e Level; Slide herda o estado do Level pai.
- Isolamento editorial: estudantes só recebem e acessam ilhas e níveis com `publishedAt IS NOT NULL`. Rascunhos são confinados à administração.
- Prefixo protegido (Progress-Aware): entidades associadas a progresso registrado por qualquer estudante têm sua ordem e estrutura congeladas; exclusão ou despublicação de conteúdo com progresso é rejeitada com erro estável.
- Concorrência: mutações administrativas validam `expectedUpdatedAt` contra o `updatedAt` persistido, rejeitando conflitos com `409` (`CONTENT_STALE`).
- Mídia: armazenamento local controlado via port `IObjectStorage`, aceitando apenas PNG, JPEG ou WebP até 5 MB enviados por `ADMIN`, com validação e normalização para WebP. Não aceita SVG de administradores.
- Progresso: `UserIslandProgress → UserLevelProgress`; cursor atual no nível; estados derivados dinamicamente, nunca enviados pelo cliente.
- Comandos: iniciar, navegar e concluir são comandos idempotentes; leitura não cria progresso; conclusão só ocorre no último slide.
- Persistência: FKs `RESTRICT`; migrations com constraints determinísticas; seed de conteúdo é all-or-nothing (ignorado integralmente caso qualquer Island exista no banco).
- Contratos: Zod em `@codelife/contracts`, sem detalhes de banco ou frameworks expostos.
- API: regras no service; controller adapta HTTP; repositories Prisma atrás de ports tipados; transações via runner explícito.
- Web: módulos donos de seus domínios; reuso compartilhado restrito a `shared`.

## Convenções de UX já acordadas

- A pessoa escolhe iniciar o nível na visão da ilha; o início ocorre silenciosamente sem modal supérfluo.
- Ao concluir um nível não final, a ação principal é seguir para o próximo nível. No último nível da ilha, a ação principal é retornar ao catálogo `/ilhas` para transição e desbloqueio da próxima ilha.
- Formulários administrativos contam com dirty guard para evitar descarte acidental de alterações não salvas ao navegar pela árvore.
- Falhas de persistência e conflitos de concorrência permanecem explícitos e recuperáveis com botões de recarregamento.

## Manutenção deste documento

Atualize este resumo apenas quando uma decisão alterar o contrato vigente. Registre a decisão completa no ADR ou roadmap apropriado e inclua o vínculo em `decision-index.md`; este arquivo não substitui as fontes canônicas.
