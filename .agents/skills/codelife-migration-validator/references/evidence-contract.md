# Contrato de evidência da Etapa 6

## Registro mínimo

Cada evidência deve permitir responder:

```text
o que foi verificado;
qual plano/critério/comportamento ela cobre;
qual fonte ou comando produziu o resultado;
qual recorte, ambiente e configuração foram usados;
qual resultado foi observado;
qual status foi atribuído;
quais limitações ou dependências permanecem.
```

Use somente estes status:

```text
PASS | FAIL | NOT RUN | NOT APPLICABLE | BLOCKED
```

`PASS` significa que o cenário foi executado e passou. `NOT RUN` não é
aprovação; `BLOCKED` exige causa; `NOT APPLICABLE` exige justificativa. Preserve
resultados negativos, avisos e falhas relevantes.

## Comparabilidade

Antes de interpretar, classifique cada comparação funcional como:

- `PRESERVAÇÃO`: finalidade e comportamento observável equivalentes;
- `ADAPTAÇÃO DELIBERADA`: finalidade mantida com mudança de contrato,
  integridade ou interação explicitamente planejada;
- `REGRESSÃO`: comportamento exigido foi perdido ou degradado;
- `NÃO COMPARÁVEL`: versões, recortes ou procedimentos não permitem confronto;
- `NÃO COLETÁVEL`: não há procedimento reproduzível para obter a medida.

Uma medida técnica disponível somente no migrado pode ser `contextual`, sem ser
comparação antes/depois. Não invente métricas ou trate contagens de testes,
cobertura, tamanho, vulnerabilidades ou dependências de bases diferentes como
melhoria direta.

## Artefatos úteis

Use apenas o que acrescentar valor auditável em
`docs/migrations/<migration-slug>/evidence/`: relatório de validação, smoke
tests, comparação, log conciso de comandos e resultados de testes/build. Evite
copiar logs completos ou registrar inspeção humana como teste automatizado.
