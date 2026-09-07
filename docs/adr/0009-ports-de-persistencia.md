# ADR 0009 — Ports explícitos para persistência

**Contexto.** Os services dependiam diretamente das classes concretas de
repository. Os testes unitários precisavam converter mocks com `as unknown as`,
e os testes dos repositories apenas verificavam o objeto de consulta enviado ao
Prisma, sem confirmar compatibilidade com schema, relações ou fixture reais.

**Decisão.** Definir um port TypeScript e um token de injeção por fronteira de
persistência coerente consumida pela aplicação. Um repository não é criado
mecanicamente por tabela ou endpoint: pode representar uma entidade simples,
como `UsersRepository`, ou uma operação que atravessa múltiplas tabelas, como
autenticação e progresso. `AuthService` depende de um port de autenticação, e
`IslandsService` depende de um port de ilhas. As implementações recebem
nomes explícitos `PrismaAuthRepository` e `PrismaIslandsRepository` e são
associadas aos tokens nos módulos Nest. Os ports expõem modelos de leitura
pertencentes à aplicação, sem tipos gerados pelo Prisma. Interfaces de services
com uma única implementação e sem boundary substituível não são obrigatórias;
nesses casos, o Nest injeta a classe concreta. Testes unitários dos services
usam mocks tipados. Cada repository Prisma possui um teste unitário de
delegação e um teste de integração contra o banco isolado e a fixture versionada.

**Alternativas.** Manter dependência nas classes concretas seria suficiente
enquanto houvesse uma única implementação, mas preservaria o acoplamento dos
services e casts inseguros nos testes. Criar interfaces para controllers e
todos os services produziria abstrações sem variação real. Testar somente a
forma da chamada ao client Prisma não detectaria incompatibilidades de schema
ou ordenação no banco.

**Consequências.** A aplicação pode substituir a tecnologia de persistência ou
usar doubles de teste sem alterar os services. Como interfaces TypeScript não
existem em runtime, cada port possui um `Symbol` usado por `@Inject` e pelo
provider do módulo. A mudança adiciona configuração explícita de DI, mas mantém
rotas, contratos HTTP, regras e schema inalterados. Novos repositories devem
seguir esse padrão quando representarem uma fronteira consumida por services;
não se exige interface espelhada para todo artefato da API.
