# Matriz de cenários — `island-3`

Classificações: **Validado** (observado diretamente por interface, HTTP ou banco), **Parcial**, **Não validado**, **Bloqueado** e **Não aplicável**. A evidência abaixo descreve o legado; não constitui regra desejada para a versão modernizada.

| # | Intenção do cenário | Resultado observado | Classificação | Evidência |
| --- | --- | --- | --- | --- |
| 1 | Pessoa autenticada abre a `island-3`. | `aluna.demo` autenticou-se e a interface exibiu `Interatividade`. | Validado | Interface em `pt.localhost:3300/island/island-3`; login HTTP `200`. |
| 2 | Três níveis aparecem na ordem esperada. | Fases `Variaveis JS`, `Eventos de Clique` e `Atualizando o DOM`, nas ordens 0, 1 e 2. | Validado | Interface e `GET /api/levels/all?lid=island-3` HTTP `200`. |
| 3 | Primeiro nível pode ser iniciado. | A fase 1 foi apresentada como link para `island-3-l1`; a API retornou seus três slides. | Validado | Interface e `GET /api/slides/all?mlid=island-3-l1` HTTP `200`. |
| 4 | Slides são percorridos na ordem esperada. | Cada nível retornou três slides nas ordens 0, 1 e 2; o acesso direto ao nível abriu seu primeiro slide e apresentou `Próximo`. | Validado | APIs de slides HTTP `200` e interface em `island-3-l3-s1`. |
| 5 | Conclusão do nível produz registro de progresso. | `POST` da conclusão de `island-3-l1` gravou `completed`. | Validado | `POST /api/userprogress/save` HTTP `200`; consulta posterior ao banco/API. |
| 6 | Progresso pode ser consultado imediatamente. | A consulta seguinte retornou `island-3-l1: completed`. | Validado | `GET /api/userprogress/mine` HTTP `200`. |
| 7 | Progresso sobrevive a recarregamento. | A leitura posterior na mesma sessão retornou o registro concluído. | Validado | Nova requisição autenticada a `/api/userprogress/mine`. |
| 8 | Progresso sobrevive a nova sessão autenticada. | Novo login de `aluna.demo` recuperou `island-3-l1: completed`. | Validado | Novo cookie de sessão; login e consulta HTTP `200`. |
| 9 | Nível concluído pode ser revisitado sem perder estado. | A listagem de slides de `island-3-l1` continuou acessível e o progresso permaneceu `completed`. | Validado | GET de slides e de progresso autenticados. |
| 10 | Próximo nível é apresentado como liberado. | Após a conclusão da fase 1, a fase 2 apareceu como link no mapa. | Validado | Interface da `island-3`. |
| 11 | Acesso direto a nível não liberado é caracterizado. | A fase 3 não era link no mapa, mas a URL direta abriu `island-3-l3-s1` com link `Próximo`. | Validado | Interface em `/island/island-3/island-3-l3`. |
| 12 | Repetição da conclusão é caracterizada. | Nova gravação de `completed` retornou `200` e preservou uma única linha. | Validado | POST HTTP `200`; SQL: `count(*) = 1`. |
| 13 | Tentativa de rebaixar conclusão é caracterizada. | POST com `skipped` retornou `200`, mas o estado continuou `completed`. | Validado | POST HTTP `200`; consulta SQL posterior. |
| 14 | Pessoa não autenticada consulta/grava progresso. | Leitura e gravação foram recusadas. | Validado | GET e POST retornaram HTTP `401`. |
| 15 | Identificador de nível inexistente é caracterizado. | O POST aceitou `tcc13-level-inexistente` e criou uma linha de progresso; a linha de sondagem foi removida após registrar o resultado. | Validado | POST HTTP `200`; SQL confirmou uma linha antes da limpeza controlada. |
| 16 | Tentativa de manipular progresso de outra pessoa é caracterizada. | Com `colega.demo`, o `uid` de `aluna.demo` no corpo foi ignorado: nenhuma linha foi criada para a aluna e uma foi criada para a pessoa da sessão; a sondagem foi removida. | Validado | POST HTTP `200`; SQL por `uid` antes da limpeza controlada. |

## Separação de evidências

- **Observado:** todos os resultados da tabela, mediante interface, HTTP ou banco local isolado.
- **Inferência técnica:** o `uid` é determinado por `req.user.id`, pois o endpoint não usa o `uid` enviado no corpo; a inferência é consistente com o resultado do cenário 16.
- **Intenção funcional:** a fase seguinte deve ser apresentada depois da conclusão anterior e o acesso direto deve ser caracterizado, sem pressupor que o legado o bloqueie.
- **Adaptações a deliberar na modernização:** validar existência de nível ao salvar progresso e impor no servidor a regra de desbloqueio, se forem requisitos do contrato modernizado.
- **Limitação:** a conclusão foi exercitada diretamente pelo endpoint utilizado pela tela de slides; não foi registrada uma captura visual dos três cliques de avanço da fase 1.
