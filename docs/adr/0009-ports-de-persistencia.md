# ADR 0009 — Ports explícitos para persistência

**Contexto.** Os services dependiam diretamente das classes concretas de
repository. Os testes unitários precisavam converter mocks com `as unknown as`,
e os testes dos repositories apenas verificavam o objeto de consulta enviado ao
Prisma, sem confirmar compatibilidade com schema, relações ou fixture reais.

**Decisão.** Definir um port TypeScript e um token de injeção por fronteira de
persistência consumida pela aplicação. O repository é orientado pela entidade
persistente que representa: `UsersRepository` acessa somente `User`, e
`ExternalIdentitiesRepository` acessa somente `ExternalIdentity`. Um service
coordena operações que atravessam entidades; quando elas precisam ser
atômicas, recebe explicitamente um runner de transação pequeno que fornece os
mesmos ports ligados ao cliente transacional. Assim, `AuthService` depende dos
ports de usuários, identidades externas e da transação de provisão, sem
conhecer Prisma e sem esconder um caso de uso multi-entidade em um
`AuthRepository`. `IslandsService` depende do port de ilhas. As implementações
Prisma são associadas aos tokens nos módulos Nest. Os ports expõem modelos de
leitura pertencentes à aplicação, sem tipos gerados pelo Prisma. Interfaces de
services com uma única implementação e sem boundary substituível não são
obrigatórias; nesses casos, o Nest injeta a classe concreta. Testes unitários
dos services usam mocks tipados. Cada repository Prisma possui um teste
unitário de delegação e um teste de integração contra o banco isolado e a
fixture versionada.

**Alternativas.** Manter dependência nas classes concretas seria suficiente
enquanto houvesse uma única implementação, mas preservaria o acoplamento dos
services e casts inseguros nos testes. Criar interfaces para controllers e
todos os services produziria abstrações sem variação real. Testar somente a
forma da chamada ao client Prisma não detectaria incompatibilidades de schema
ou ordenação no banco.

**Consequências.** A aplicação pode substituir a tecnologia de persistência ou
usar doubles de teste sem alterar os services. Como interfaces TypeScript não
existem em runtime, cada port possui um token usado por `@Inject` e pelo
provider do módulo. A mudança adiciona configuração explícita de DI, mas mantém
rotas, contratos HTTP, regras e schema inalterados. Novos repositories devem
seguir o recorte por entidade quando representarem uma fronteira consumida por
services; coordenação transacional pertence ao service e a um runner pequeno,
sem exigir uma camada genérica de unidade de trabalho.
