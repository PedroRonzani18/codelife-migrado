---
name: codelife-architecture-review
description: Avaliar, planejar ou executar refatorações estruturais no CodeLife migrado, incluindo módulos, contratos, persistência, schema, migrations, abstrações e limites entre API e web.
---

# Revisão arquitetural do CodeLife

Use este skill antes de criar, remover ou mover módulos, camadas, abstrações,
exports públicos, modelos de persistência ou componentes compartilhados.

## Modo padrão: análise sem escrita

Leia `AGENTS.md`, o contrato atual, o índice de decisões e os ADRs aplicáveis.
Mapeie a estrutura existente e as dependências reais antes de propor uma nova
pasta, interface ou componente.

Apresente:

1. problema concreto e evidência no código;
2. padrão vigente e fonte canônica;
3. opções consideradas, incluindo manter a estrutura;
4. impacto em contratos, migrations, testes, documentação e consumidores;
5. recomendação mínima e critérios objetivos de aceite.

## Critérios para permitir uma abstração

Uma nova camada ou componente só é adequada quando houver pelo menos uma destas
condições:

- dois ou mais consumidores reais com a mesma responsabilidade;
- fronteira tecnológica ou de injeção necessária para isolamento/teste;
- capacidade de domínio com ciclo de vida, imports ou políticas próprias;
- decisão explícita registrada no roadmap ou em ADR.

Não crie abstração para antecipar CMS, reutilização de conteúdo, múltiplas
trilhas, versionamento, concorrência avançada ou comportamento ainda fora do
recorte experimental.

## Quando a escrita for autorizada

Registre a decisão em ADR quando ela for durável e alterar uma fronteira ou
invariante. Atualize o índice e o contrato compacto. Execute a validação mais
ampla dentre as áreas afetadas; schema, migration e seed sempre exigem
`pnpm verify`.
