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

Leia ADRs 0008 e 0009 antes de uma reorganização estrutural.
