# Ambiente, roteiro e evidências — `island-3`

## Identificação da coleta

| Campo | Valor |
| --- | --- |
| Data e horário | 2026-08-16 22:37:35 BRT |
| Legado executado | `codelife` no commit `9f023a464218155e38de0fa98359236ed062fd5a` |
| Estado do checkout original | Havia alterações locais em `.gitignore`, `README.md`, `docs/diagnostico-base-funcional.md`, `package.json`, `seed_functional_recorte.sh`, `tools/seed_trail_3x3.sh` e `tools/setup-sharp.sh`; elas não foram usadas. |
| Checkout de execução | Worktree limpo e destacado no commit de referência, em diretório temporário. |
| Repositório dos artefatos | `codelife-migrado`, branch `tcc/bloco-13-linha-base-island-3`. |

## Ambiente controlado

| Componente | Versão/valor observado |
| --- | --- |
| Sistema operacional | macOS 26.5.2, `arm64` |
| Node para o legado | 10.24.1, selecionado por `fnm` |
| Node do host | 24.18.0 |
| NPM do host | 11.16.0 |
| PostgreSQL | 10.21 (imagem `postgres:10`) |
| Docker | 29.6.1 |
| Docker Compose | 5.3.1 |
| Aplicação | `canon-dev`, porta 3300 |
| Banco | contêiner e volume isolados: `codelife-tcc13-postgres` e `codelife_tcc13_baseline` |
| Contas sintéticas | `aluna.demo` (principal) e `colega.demo` (teste de autorização); senhas não são registradas neste artefato. |

## Roteiro mínimo reproduzível

1. Criar um worktree limpo no commit de referência e usar um banco PostgreSQL 10 vazio e isolado.
2. Criar `.env` local com as variáveis não secretas descritas no `README.md` do legado. Selecionar Node 10.24.1.
3. Iniciar o banco e executar, nesta ordem, os SQLs versionados:

   ```bash
   psql -f tools/bootstrap_initial_data.sql
   psql -f tools/seed_trail_3x3.sql
   psql -f seed_functional_recorte.sql
   ```

4. Executar a cópia dos placeholders prevista em `tools/seed_trail_3x3.sh` e iniciar a aplicação com as variáveis exportadas no mesmo shell:

   ```bash
   set -a; source .env; set +a
   eval "$(fnm env --use-on-cd)"; fnm use 10
   ./node_modules/.bin/canon-dev
   ```

5. Abrir `http://pt.localhost:3300`, autenticar uma conta sintética e seguir a matriz. Para `pt.localhost` e `en.localhost`, manter as entradas locais de host previstas pelo README.

Na coleta, o cliente `psql` não estava instalado no host; os mesmos três arquivos SQL versionados foram enviados ao `psql` do contêiner PostgreSQL. Isso não alterou conteúdo ou ordem dos seeds.

## Evidências relevantes registradas

| Fonte | Resultado |
| --- | --- |
| Inicialização do banco | O schema `public` começou sem tabelas. |
| Inicialização do app | A sincronização automática parou em `relation "slug_unique_idx" already exists`; o bootstrap versionado completou as tabelas faltantes. |
| Verificação da fixture | `islands=1`, `levels=3`, `slides=9`, `blocking_activity=0` para a fatia `island-3`. |
| Tipos de slides | `TextText`, `TextImage` e `TextCode`, todos observados por SQL/API. |
| Login principal | `POST /auth/local/login` retornou `200`. |
| Progresso | POST e GET autenticados retornaram `200`; leitura/escrita sem sessão retornaram `401`. |
| Integridade de repetição | Duas conclusões de `island-3-l1` resultaram em uma única linha `completed`. |
| Autorização | O corpo não conseguiu substituir o usuário da sessão no cenário 16. |

## Bloqueios, limitações e limpeza

- O acesso por `http://127.0.0.1:3300` deixou a interface em carregamento por tentar compor o host inválido `pt.127.0.0.1`; a execução visual foi realizada corretamente em `pt.localhost:3300`.
- Não houve bloqueio para a matriz. A limitação de captura visual da jornada completa da fase 1 está declarada na matriz.
- Os registros de sondagem `tcc13-level-inexistente` e `tcc13-authorization-probe` foram removidos após a observação. O único progresso adicional preservado no banco isolado foi `aluna.demo / island-3-l1 / completed`.
- Não foram versionados cookies, respostas de login, senhas, hashes de senha, tokens, dados pessoais ou arquivos de cache/voláteis.
