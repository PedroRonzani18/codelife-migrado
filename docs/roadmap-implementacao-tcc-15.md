# Roadmap de implementação do TCC-15

## Jornada autenticada com navegação persistida, liberação e conclusão por nível

**Card:** TCC-15

**Estado:** Macroetapas 1 e 2 concluídas; próxima execução começa na Macroetapa 3

**Última revisão arquitetural:** 21 de agosto de 2026
**Decisão vigente:** [ADR 0011 — Hierarquia direta e progresso por ilha e nível](adr/0011-hierarquia-direta-e-progresso-por-ilha-e-nivel.md)

## 1. Objetivo

Entregar uma jornada vertical autenticada para a `island-3`, composta por três
níveis e nove slides, com:

- leitura ordenada de ilha, níveis e slides;
- início explícito e idempotente de nível;
- cursor persistido no slide atual;
- navegação sequencial durante o andamento;
- conclusão explícita somente no último slide;
- liberação sequencial dos níveis;
- retomada por pessoa autenticada;
- respostas e erros validados por contratos compartilhados.

A contribuição experimental continua delimitada. Ela não representa migração
integral do CodeLife nem validação universal da metodologia do TCC.

## 2. Escopo

### Incluído

- uma ilha (`island-3`);
- três níveis e nove slides controlados;
- tipos `TextText`, `TextImage` e `TextCode`;
- ativos locais controlados;
- autenticação experimental já existente;
- progresso por ilha e nível;
- cursor do slide atual;
- estados derivados `available`, `in_progress`, `blocked` e `completed`;
- snapshot canônico de progresso;
- frontend responsivo e acessível da jornada;
- testes unitários, integração, E2E e evidências.

### Fora do escopo

- CRUD HTTP administrativo, CMS e upload;
- múltiplas trilhas ou reutilização do mesmo nível/slide entre pais;
- editor ou execução de código;
- discussões, reações, pontuação ou gamificação;
- percentual, maior avanço ou histórico persistidos;
- conclusão de ilha ou trilha;
- reset de progresso por API;
- migração automática de progresso ambíguo;
- protocolo especial para múltiplas abas;
- versionamento formal e invalidação automática de conteúdo.

## 3. Arquitetura consolidada

### 3.1 Conteúdo direto

```text
Island
  └─ Level (islandId, position)
       └─ Slide (levelId, position)
```

Regras:

- UUIDs das entidades são as identidades públicas;
- `UNIQUE(islandId, position)` ordena níveis;
- `UNIQUE(levelId, position)` ordena slides;
- posições são positivas;
- anterior e próximo são derivados, não persistidos;
- FKs usam `RESTRICT`;
- `Slide.type` deve possuir exatamente o subtipo correspondente.

O conteúdo é mantido internamente por repositories e pelo seed. Um CRUD HTTP
genérico só deverá ser criado quando existir um caso de uso administrativo e
uma política de autorização correspondentes.

### 3.2 Progresso

```text
UserIslandProgress
  userId
  islandId
  currentLevelId
  startedAt
  └─ UserLevelProgress
       levelId
       currentSlideId
       startedAt
       completedAt?
```

Restrições:

```text
UNIQUE(userId, islandId)
UNIQUE(userIslandProgressId, levelId)
```

Não existe `UserSlideProgress`. O cursor atual pertence ao progresso do nível.
Não existe progresso de trilha porque a trilha não é um agregado necessário ao
recorte.

### 3.3 Estados derivados

- `completed`: há `completedAt`;
- `in_progress`: há progresso sem `completedAt`;
- `available`: é o primeiro nível ou o anterior está concluído;
- `blocked`: o predecessor ainda não foi concluído.

Os estados não são persistidos e não podem ser enviados pelo cliente.

### 3.4 Comandos e transições

Início:

```text
POST /api/progress/levels/:levelId/start
body: {}
```

- exige nível existente e disponível;
- cria `UserIslandProgress` e `UserLevelProgress` quando ausentes;
- posiciona o cursor no primeiro slide;
- repetição não reinicia nem altera conclusão.

Navegação:

```text
PUT /api/progress/levels/:levelId/current-slide
body: { "slideId": "uuid" }
```

- exige início explícito;
- valida pertencimento do slide ao nível;
- durante o andamento aceita posição atual, anterior ou seguinte;
- após conclusão aceita qualquer slide do mesmo nível para revisão;
- atualiza os cursores da ilha e do nível na mesma transação.

Conclusão:

```text
POST /api/progress/levels/:levelId/complete
body: {}
```

- exige nível iniciado e cursor no último slide;
- grava timestamp do servidor;
- é idempotente e preserva o primeiro `completedAt`;
- libera o próximo nível por estado derivado.

### 3.5 Leituras

```text
GET /api/learning/islands/:islandSlug
GET /api/learning/levels/:levelId
GET /api/progress
```

`GET` nunca cria progresso. A leitura de nível devolve slides ordenados com
`previousSlideId` e `nextSlideId`. O snapshot contém ilhas, níveis, progresso,
`lastVisited` e `nextRecommended`.

### 3.6 Erros de domínio

| Código | HTTP | Uso |
|---|---:|---|
| `LEVEL_BLOCKED` | 403 | pré-requisito ainda não concluído |
| `LEVEL_NOT_STARTED` | 409 | navegação ou conclusão antes do início |
| `INVALID_SLIDE_TRANSITION` | 409 | salto não adjacente durante o andamento |
| `LEVEL_NOT_READY_FOR_COMPLETION` | 409 | conclusão fora do último slide ou conflito atômico |
| `RESOURCE_NOT_FOUND` | 404 | ilha, nível ou slide não encontrado no contexto |
| `VALIDATION_ERROR` | 400 | UUID ou body inválido |

Toda resposta de erro segue o envelope compartilhado e contém `requestId`.

### 3.7 Concorrência e segurança

- autenticação vem exclusivamente da sessão;
- o cliente não envia `userId`, estado ou timestamps;
- comandos mutáveis exigem origem confiável;
- início usa upserts idempotentes dentro de transação;
- navegação altera os dois cursores em transação;
- conclusão usa atualização condicional em `completedAt IS NULL` e no slide
  esperado;
- última navegação confirmada vence; não há revisão otimista pública.

## 4. Macroetapa 1 — Modelo, migration, seed e contratos

**Estado:** concluída e revisada pelo ADR 0011.

Entregas atuais:

- [x] registrar a decisão de hierarquia direta;
- [x] modelar `Island → Level → Slide`;
- [x] modelar `UserIslandProgress → UserLevelProgress`;
- [x] preservar subtipos e `MediaAsset`;
- [x] criar migration de conversão protegida;
- [x] bloquear conversão diante de reutilização ou progresso ambíguo;
- [x] manter seed idempotente e não destrutivo para progresso;
- [x] validar fixture exata `1 × 3 × 9`;
- [x] publicar contratos Zod com IDs diretos e bodies estritos;
- [x] validar upgrade desde a fundação TCC-14.

Critério de encerramento: schema, migration, seed e contratos representam uma
única arquitetura e passam nos gates do repositório.

## 5. Macroetapa 2 — API, persistência e regras de domínio

**Estado:** concluída.

### Organização

```text
learning/
  islands/
  levels/
    repository/
  progress/
    repository/
  media/
```

### Entregas

- [x] repository e leitura direta de ilha;
- [x] repository e leitura direta de nível e slides;
- [x] mapeamento seguro dos três subtipos;
- [x] snapshot canônico sem efeitos colaterais;
- [x] início explícito e idempotente;
- [x] navegação adjacente simplificada por diferença de posição;
- [x] revisão livre de nível concluído;
- [x] conclusão explícita, condicional e idempotente;
- [x] liberação sequencial derivada;
- [x] erros Nest apropriados com códigos estáveis;
- [x] autenticação e proteção de origem nos endpoints;
- [x] isolamento de progresso por pessoa;
- [x] testes unitários e de integração de repository, service e HTTP.

### Cenários obrigatórios

- snapshot vazio não cria registro;
- iniciar nível cria apenas uma raiz de ilha e um nível;
- início repetido é idempotente, inclusive concorrente;
- nível bloqueado retorna `403`;
- navegação antes do início retorna `409`;
- slide de outro nível retorna `404`;
- salto não adjacente retorna `409`;
- chegar ao último slide não conclui automaticamente;
- conclusão antecipada retorna `409`;
- conclusão repetida preserva timestamp;
- conclusão libera o nível seguinte;
- seed posterior preserva progresso;
- duas pessoas não compartilham progresso;
- sessão ausente, origem inválida e bodies extras são rejeitados.

Critério de encerramento: todos os cenários passam em banco PostgreSQL isolado,
com cobertura global acima do gate do repositório.

## 6. Macroetapa 3 — Jornada no frontend

**Estado:** pendente.

### Tarefas

1. Criar rotas autenticadas da ilha e do nível usando UUID de `Level` e
   `Slide` nas URLs.
2. Criar cliente de API tipado para ilha, nível, snapshot e três comandos.
3. Implementar página da ilha com estados disponível, em andamento, bloqueado
   e concluído.
4. Implementar leitor com renderizadores `TextText`, `TextImage` e `TextCode`.
5. Exigir ação de “Iniciar nível” antes de abrir o leitor pela primeira vez.
6. Persistir navegação antes de atualizar a tela.
7. Mostrar ação explícita de conclusão somente no último slide.
8. Permitir revisão de níveis concluídos sem alterar `completedAt`.
9. Tratar os códigos de domínio com mensagens consistentes.
10. Garantir foco, teclado, texto alternativo, responsividade e estados de
    carregamento/erro.

### Testes

- página da ilha nos quatro estados;
- início explícito;
- anterior/próximo e recarga no cursor persistido;
- conclusão e desbloqueio;
- acesso direto bloqueado;
- renderização dos três subtipos;
- erro de comando mantém o último slide confirmado.

Critério de encerramento: uma pessoa conclui os três níveis pelo navegador e,
após novo login, retoma o estado correto.

## 7. Macroetapa 4 — Validação, evidências e fechamento

**Estado:** pendente.

### Tarefas

1. Manter banco isolado e limpeza determinística nas suítes.
2. Criar E2E da jornada completa e da retomada.
3. Executar `pnpm verify` em ambiente limpo.
4. Registrar matriz requisito → implementação → teste → evidência.
5. Atualizar OpenAPI e documentação técnica.
6. Capturar evidências visuais desktop e mobile.
7. Executar roteiro humano de até dez minutos.
8. Registrar riscos residuais e diferenças em relação ao legado.

### Critérios finais

- [ ] instalação, migration e seed funcionam em base limpa;
- [ ] upgrade protegido desde TCC-14 funciona;
- [ ] login, logout e proteção de origem permanecem válidos;
- [ ] jornada completa funciona no navegador;
- [ ] retomada funciona após nova sessão;
- [ ] acessibilidade básica e responsividade foram verificadas;
- [ ] testes unitários, integração e E2E passam;
- [ ] documentação e evidências correspondem ao comportamento executado.

## 8. Dependências

| Entrega | Depende de | Libera |
|---|---|---|
| Hierarquia direta | ADR 0011 | seed e repositories |
| Contratos | hierarquia e comandos | API e frontend |
| API de progresso | contracts, auth e Prisma | jornada frontend |
| Frontend | API estável | E2E e evidências |
| E2E | frontend completo | fechamento experimental |

Cada macroetapa deve ser revisável separadamente. Não criar commit, push ou PR
sem solicitação explícita do usuário.

## 9. Definição de pronto global

O TCC-15 termina quando a fixture `1 × 3 × 9` puder ser percorrida por uma
pessoa autenticada com início explícito, cursor persistido, bloqueio sequencial,
conclusão idempotente e retomada; quando todo o comportamento estiver coberto
pelos gates automatizados e por evidência humana; e quando a documentação
acadêmica diferenciar preservação, adaptação e limitações sem generalizar o
resultado para o CodeLife inteiro.
