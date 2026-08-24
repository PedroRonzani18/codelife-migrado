# Configuração local e validação humana

1. Instale Node 24 e habilite Corepack (`corepack enable`).
2. Execute `pnpm bootstrap`. O comando cria `apps/api/.env` e `apps/web/.env`
   a partir dos exemplos apenas quando os arquivos ainda não existem.
3. Revise a `DATABASE_URL` local, o `JWT_SECRET` de pelo menos 32 caracteres,
   `JWT_ISSUER` e `JWT_AUDIENCE` em `apps/api/.env`; não versione esse arquivo.
   Em `apps/web/.env`, mantenha exclusivamente `VITE_API_URL`, pois variáveis
   `VITE_*` ficam visíveis no bundle do navegador.
4. Execute `pnpm db:up`, `pnpm db:migrate`, `pnpm db:seed` e `pnpm dev`.
5. Abra `http://localhost:5173`, inicie a sessão experimental e confirme visualmente **Interatividade**, três fases e a contagem informada de nove slides.

O login experimental é uma porta deliberadamente estreita: não recebe corpo,
não aceita identificador arbitrário, autentica apenas `aluna.demo` e é recusado
em produção ou sem `EXPERIMENTAL_LOGIN_ENABLED=true`.

Para inspeção da API, abra `http://localhost:3001/docs`. Liveness está em
`/health/live` e readiness do PostgreSQL em `/health/ready`; `/health` continua
como alias. `GET /auth/me` retorna 401 sem cookie e a pessoa da fixture depois
do login experimental. Respostas incluem `x-request-id` para correlação.

## Roteiro de inspeção TCC-15 (até dez minutos)

1. No desktop, inicie a sessão e confirme que apenas a primeira etapa está
   disponível; tente abrir diretamente a segunda e confirme o bloqueio.
2. Inicie a primeira etapa, avance até o segundo slide com o teclado, saia e
   entre novamente. A abertura do nível deve recuperar esse mesmo slide.
3. Conclua as três etapas; a conclusão deve aparecer somente no terceiro slide
   de cada uma e liberar a seguinte.
4. Saia e entre outra vez; confirme a ilha concluída e abra uma etapa em modo
   de revisão, sem alterar sua conclusão.
5. Repita a inspeção com viewport de 390 px: conteúdo, botões e indicador de
   slide devem permanecer legíveis, navegáveis por teclado e sem rolagem
   horizontal.

As capturas de referência e a matriz de rastreabilidade desta execução estão
em `docs/evidence/tcc-15-validation.md`. A mesma jornada é automatizada pelo
Playwright dentro de `pnpm verify`.
