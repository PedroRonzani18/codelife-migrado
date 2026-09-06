# API — regras locais

Mantenha `auth`, `health`, `learning` e `prisma` como fronteiras de primeiro
nível. Em domínio com múltiplas capacidades, organize primeiro por capacidade
(`islands`, `levels`, `progress`, `media`) e mantenha controller, service,
repository e testes coesos; não crie uma camada global nova sem necessidade
demonstrada.

- Controllers adaptam HTTP, autenticação e validação; não concentram regra de
  negócio ou acesso Prisma.
- Services são donos de comandos, transições e erros de domínio.
- Repositories Prisma mapeiam persistência e são ocultos por ports tipados
  quando consumidos por services. Não crie interfaces espelhadas para tudo.
- Nunca exponha tipos Prisma em contratos HTTP ou `packages/contracts`.
- Mudanças em endpoint público atualizam contrato Zod, OpenAPI, testes de
  integração e consumidor web afetado.
- Regra de negócio, guard, repository ou filtro novo requer teste unitário;
  repository Prisma requer também teste de integração quando consulta, ordem ou
  relação do banco mudar.

## Fluxo para novos endpoints

Antes de editar, descreva o caso de uso observável, o escopo, os consumidores e
as regras de negócio confirmadas. Use o skill `codelife-nest-endpoint` para
organizar a execução e o `codelife-change-contract` para registrar o contrato
da mudança.

- Defina primeiro o shape público, os códigos de erro, a autenticação e a
  autorização; não derive o contrato HTTP diretamente de tipos Prisma.
- Escolha a capacidade de negócio dona do endpoint antes de criar o módulo e
  mantenha controller, service, repository, ports e testes próximos dela.
- Crie uma migration ou alteração de seed somente quando houver necessidade
  persistente demonstrada; não use o seed como substituto de um importador.
- Se o endpoint fizer parte de uma tela nova, registre explicitamente o
  consumidor web e coordene a mudança com `packages/contracts`.
- Durante o desenvolvimento, use validação proporcional; antes de encerrar a
  fatia, não deixe testes, migrations, OpenAPI ou consumidores afetados sem
  uma situação registrada.

Leia ADRs 0008 e 0009 antes de uma reorganização estrutural.
