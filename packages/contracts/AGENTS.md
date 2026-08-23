# Contracts — regras locais

- `packages/contracts` contém somente shapes públicos Zod, tipos derivados e
  códigos/envelopes de erro compartilhados.
- Organize exports por domínio; o barrel raiz preserva conveniência, mas não
  deve virar um módulo monolítico.
- Não importe Prisma, Nest, React, banco, `process.env` ou infraestrutura.
- Schemas de entrada devem ser estritos quando o endpoint exigir body fechado.
- Alteração pública exige testes do schema e atualização coordenada da API e do
  web consumidores.

Leia ADRs 0001 e 0004 antes de alterar a superfície pública.
