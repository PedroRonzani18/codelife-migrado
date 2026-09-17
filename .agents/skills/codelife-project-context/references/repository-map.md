# Mapa factual do repositório

Este mapa registra localizações relativamente estáveis. Verifique o filesystem
quando uma migração depender de um arquivo específico; o mapa não substitui a
inspeção do código.

## Repositórios relacionados

- CodeLife migrado: raiz do repositório atual; remote
  `git@github.com:PedroRonzani18/codelife-migrado.git`.
- CodeLife legado: `../codelife` quando o checkout irmão estiver disponível;
  remote `git@github.com:PedroRonzani18/codelife.git`.
- TCC e fonte da metodologia: `../TCC` quando o checkout irmão estiver
  disponível; remote `git@github.com:PedroRonzani18/TCC.git`.
- Documentação reproduzida no migrado: `docs/`, especialmente os inventários,
  critérios, ADRs, linha de base, evidências e roadmap existentes.
- Jira: o padrão de identificação observado na documentação é `TCC-*`; não há
  conector/configuração local suficiente para afirmar projeto, URL ou acesso.

Os repositórios irmãos são fontes de análise, não áreas de escrita desta
infraestrutura. Preserve alterações locais que existirem neles.

## Estrutura do migrado

```text
apps/api/                 API Nest, autenticação, capacidades e Prisma runtime
apps/api/prisma/          schema Prisma dividido, migrations e seed
apps/web/                 React/Vite, rotas, features e módulos de jornada
packages/contracts/       shapes públicos Zod, tipos derivados e erros
packages/eslint-config/   configuração compartilhada de lint
packages/tsconfig/        configuração compartilhada de TypeScript
scripts/                  bootstrap, banco local, check e verify
docs/adr/                 decisões duráveis da arquitetura
docs/evidence/            somente comportamento/execução já validado
.codex/context/           contrato compacto atual e índice de decisões
.agents/skills/           Skills locais versionadas do repositório
```

## Fronteiras observadas

### API

`apps/api/src/` contém as fronteiras de primeiro nível `auth`, `health`,
`learning`, `prisma` e `users`. Em `learning`, as capacidades observadas são
`islands`, `levels`, `progress` e `media`, com controllers, services,
repositories, ports e testes próximos da capacidade. O bootstrap configura
ValidationPipe, cookies, segurança HTTP, request ID, erros e Swagger/OpenAPI.

### Persistência

`apps/api/prisma/schema/` contém o schema dividido por entidade e enum;
`apps/api/prisma/migrations/` contém migrations versionadas;
`apps/api/prisma/seed.ts` e `seed.spec.ts` contêm o seed e seus testes. Alteração
nessa área exige também `apps/api/prisma/AGENTS.md`.

### Web

`apps/web/src/app/` concentra composição e roteamento. `features/` contém
capacidades como `auth` e `admin-users`; `modules/learning/` contém a jornada,
queries, mutations, seletores, views e renderizadores de slides. `shared/` e
`components/ui/` são infraestrutura e primitivos reutilizáveis, sujeitos às
regras de reuso de `apps/web/AGENTS.md`.

### Contratos

`packages/contracts/src/` contém `auth`, `common`, `errors`, `learning`,
`progress` e `users`. A API pública compartilhada passa por Zod e não importa
Prisma, Nest, React, banco ou infraestrutura.

## Qualidade e automação

Os workflows de CI estão em `.github/workflows/quality.yml` e
`.github/workflows/security.yml`. Os scripts raiz e dos workspaces são a fonte
canônica dos comandos; consulte [commands.md](commands.md) antes de escolher
um gate.
