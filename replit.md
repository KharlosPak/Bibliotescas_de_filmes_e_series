# Streaming Library API — Contexto do Projeto

Documentação completa em `DOCUMENTACAO.md`.

## Stack
Bun · ElysiaJS 1.4.x · Drizzle ORM · PostgreSQL

## Entry point
`src/index.ts` — porta 5000

## Ficheiros principais
- `src/db/schema.ts` — schema: users, contents, user_library, refresh_tokens
- `src/config/env.ts` — JWT_EXPIRES_IN_SECONDS = 14min, REFRESH_TOKEN = 7 dias
- `src/middlewares/auth.guard.ts` — JWT derive global
- `src/middlewares/rate-limit.ts` — rate limiting in-memory
- `src/routes/` — auth, user, admin, catalog
- `src/services/` — auth, user, admin
- `src/tests/api.test.ts` — 22 testes (22/22 passam)

## Nota Elysia 1.4.x
Plugin `onBeforeHandle` só propaga na segunda utilização. Solução: adicionar `onBeforeHandle` diretamente na instância do router.

## GitHub
https://github.com/KharlosPak/Bibliotescas_de_filmes_e_series
