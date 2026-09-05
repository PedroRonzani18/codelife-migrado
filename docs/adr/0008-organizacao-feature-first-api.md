# ADR 0008 — Organização feature-first da API

**Contexto.** A fundação separava `auth`, `health`, `learning` e `prisma` como
módulos Nest, mas mantinha todos os artefatos de cada módulo no mesmo nível.
Essa estrutura era suficiente para a primeira leitura de ilha, porém deixaria
`learning` ambíguo ao receber navegação, disponibilidade e progresso no TCC-15.
`auth` e `common` também já reuniam artefatos auxiliares de responsabilidades
distintas na mesma pasta.

**Decisão.** Manter módulos de negócio e infraestrutura como fronteiras de
primeiro nível. Dentro de módulos que reúnam mais de uma capacidade, organizar
o código primeiro por funcionalidade e manter controller, service, repository
e testes próximos. A leitura de ilha passa a ocupar `learning/islands`; futuras
operações de progresso devem ocupar `learning/progress`. Em `auth`, guards,
decorators, tipos HTTP e opções de cookie ficam agrupados por responsabilidade.
Em `common`, elementos do protocolo HTTP ficam separados da instrumentação de
requisições. Pastas adicionais por camada técnica só devem ser criadas quando
houver mais de um artefato da mesma categoria dentro da funcionalidade.

**Alternativas.** Manter cada módulo totalmente plano continuaria adequado para
módulos pequenos, mas aumentaria a ambiguidade de `learning`. Separar toda a API
em pastas globais de controllers, services e repositories reduziria a coesão
por funcionalidade. Introduzir camadas de domínio e aplicação independentes ou
um módulo Nest para cada subpasta adicionaria fronteiras sem necessidade no
recorte atual.

**Consequências.** A organização passa a refletir capacidades sem alterar
rotas, contratos, injeção de dependência ou persistência. `LearningModule`
permanece como composição do domínio de aprendizagem, e `AuthModule` continua
dono das políticas globais de autenticação. `HealthModule` e `PrismaModule`
permanecem planos enquanto tiverem poucos artefatos. Uma funcionalidade poderá
ser promovida a módulo Nest próprio quando precisar de imports, exports ou
ciclo de vida independentes.
