# Prisma — regras locais

- Nunca edite migration já aplicada. Crie uma nova migration para toda mudança
  de schema e revise o SQL gerado.
- Não use `CASCADE`, reset, limpeza silenciosa ou conversão especulativa de
  progresso. Dados ambíguos devem bloquear a migration com erro explícito.
- O seed deve ser determinístico, idempotente e não destrutivo para progresso;
  divergências de conteúdo devem falhar em vez de apagar dados.
- Confirme a origem e o nome do banco antes de comandos locais de banco.
- Para qualquer alteração em schema, migration ou seed, execute `pnpm verify`
  e registre claramente qualquer cenário que não puder ser exercitado.

Leia ADR 0005, ADR 0011 e o roadmap §4 antes de modificar estes arquivos.
