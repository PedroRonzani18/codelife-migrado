# Síntese para validação humana — linha de base `island-3`

## Resultado

A execução no commit `9f023a464218155e38de0fa98359236ed062fd5a` confirmou a fixture específica: uma `island-3` (`Interatividade`), três níveis ordenados e nove slides ordenados, com tipos restritos a `TextText`, `TextImage` e `TextCode`. Não há atividade bloqueante nessa fatia.

Com a conta sintética `aluna.demo`, a interface abriu a ilha e exibiu as fases 1 e 2 como links após a conclusão registrada da fase 1. O nível pode ser revisitado e o progresso `island-3-l1: completed` persistiu em nova sessão autenticada. O endpoint recusou leitura e gravação de progresso sem autenticação (`401`); repetição da conclusão não duplicou a linha, e uma tentativa de rebaixar `completed` para `skipped` preservou o estado concluído.

## Divergências relevantes do legado

1. A fase 3 não é apresentada como link no mapa enquanto a fase 2 não está concluída, mas o acesso direto a `/island/island-3/island-3-l3` redireciona para o primeiro slide e permite avançar. O desbloqueio visual não corresponde, portanto, a uma proteção de rota.
2. `POST /api/userprogress/save` aceitou o identificador inexistente `tcc13-level-inexistente` e criou uma linha de progresso. A API não validou a existência do nível nesse fluxo.
3. No teste de autoria cruzada, um `uid` da outra pessoa enviado no corpo foi ignorado; o registro foi criado para a pessoa autenticada. O comportamento observado preserva o escopo da sessão, embora a resposta HTTP seja `200`.
4. A aplicação não concluiu automaticamente a sincronização do esquema num banco vazio: uma restrição duplicada de `slug` interrompeu essa etapa. O bootstrap versionado `tools/bootstrap_initial_data.sql` permitiu completar o esquema sem alterar o legado.

## Deliberação solicitada

Confirmar que esses comportamentos representam adequadamente a linha de base do legado. Para a versão modernizada, a validação de existência do nível e a proteção efetiva de acesso a níveis bloqueados devem ser tratadas como adaptações deliberadas, e não como comportamento já comprovado do legado.

O roteiro reproduzível e a matriz completa estão em [ambiente-e-roteiro.md](ambiente-e-roteiro.md) e [matriz-cenarios.md](matriz-cenarios.md).
