# Relatório de execução

Salvar como `docs/migrations/<migration-slug>/execution/<n>-result.md`:

```markdown
# Execution Result — Macrostep N

Status: CONCLUÍDA | BLOQUEADA | PARCIAL

## Escopo executado
## Arquivos alterados
## Alterações pré-existentes relevantes
## Decisões locais
## Skills especialistas aplicadas
## Testes executados
## Comandos executados
## Critérios de aceite
- [x] <critério realmente verificado>
- [ ] <critério pendente, com motivo>
## Desvios em relação ao plano
## Alterações fora do escopo
## Pendências
## Decisão arquitetural necessária
## Evidências
```

Registre comando, resultado e contexto suficiente para reprodução sem despejar
logs inteiros. `CONCLUÍDA` exige que o escopo e os critérios estejam atendidos;
`PARCIAL` ou `BLOQUEADA` deve identificar o próximo passo ou decisão necessária.
Não declare teste, smoke, build ou inspeção visual que não tenha sido executado.
