# Streaming Library API

API REST para gestão de biblioteca pessoal de filmes e séries, construída com Bun + ElysiaJS + Drizzle ORM + PostgreSQL.

## Stack

- **Runtime**: Bun
- **Framework**: ElysiaJS 1.4.x
- **ORM**: Drizzle ORM
- **Base de dados**: PostgreSQL (provisionado pelo Replit)
- **Autenticação**: JWT + Refresh Tokens (armazenados na DB)

## Estrutura do Projeto

```
src/
├── config/
│   ├── db.ts           # Ligação Drizzle + exportação do schema
│   └── env.ts          # Variáveis de ambiente validadas
├── db/
│   └── schema.ts       # Tabelas: users, contents, user_library, refresh_tokens
├── middlewares/
│   ├── auth.guard.ts   # JWT derive (global) + onBeforeHandle
│   └── rate-limit.ts   # Rate limiter in-memory por IP+rota
├── routes/
│   ├── auth.routes.ts  # /auth — registo, login, refresh, logout, perfil
│   ├── user.routes.ts  # /users — biblioteca pessoal + stats
│   ├── admin.routes.ts # /admin — gestão do catálogo (role: admin)
│   └── catalog.routes.ts # /catalog — pesquisa pública com paginação
├── services/
│   ├── auth.service.ts   # CRUD users + refresh tokens
│   ├── user.service.ts   # Biblioteca do utilizador
│   └── admin.service.ts  # Catálogo + pesquisa
├── tests/
│   └── api.test.ts     # 22 testes de integração (22/22 passam)
└── index.ts            # Entry point: plugins, rotas, error handler global
```

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/` | — | Healthcheck |
| POST | `/auth/register` | — | Criar conta (rate: 10/hora) |
| POST | `/auth/login` | — | Login → accessToken + refreshToken (rate: 10/15min) |
| POST | `/auth/refresh` | — | Renovar tokens |
| POST | `/auth/logout` | JWT | Revogar sessão atual |
| POST | `/auth/logout-all` | JWT | Revogar todas as sessões |
| GET | `/auth/me` | JWT | Ver perfil |
| PATCH | `/auth/me` | JWT | Atualizar nome/email |
| PATCH | `/auth/me/password` | JWT | Alterar password |
| GET | `/catalog` | — | Pesquisar catálogo (q, type, genre, year, page, limit) |
| GET | `/catalog/:id` | — | Detalhes de um conteúdo |
| GET | `/users/stats` | JWT | Estatísticas da biblioteca |
| GET | `/users/library` | JWT | Listar biblioteca (filtro: ?status=) |
| POST | `/users/library` | JWT | Adicionar à biblioteca |
| PATCH | `/users/library/:contentId` | JWT | Atualizar estado |
| DELETE | `/users/library/:contentId` | JWT | Remover da biblioteca |
| GET | `/admin/content` | JWT+Admin | Listar catálogo |
| POST | `/admin/content` | JWT+Admin | Criar conteúdo |
| PUT | `/admin/content/:id` | JWT+Admin | Editar conteúdo |
| DELETE | `/admin/content/:id` | JWT+Admin | Remover conteúdo |

## Estados de Visualização

- `to_watch` — Por Visualizar
- `watching` — A Visualizar
- `watched` — Visualizado

## Tokens

- **Access Token**: JWT válido por **14 minutos**, contém `sub` (userId) e `role`
- **Refresh Token**: hex(64) válido por **7 dias**, armazenado na DB com rotação automática

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de ligação PostgreSQL (auto-provisionada pelo Replit) |
| `JWT_SECRET` | Segredo para assinar JWTs (Replit Secret) |
| `PORT` | Porta do servidor (default: 5000) |

## Segurança

- Passwords com argon2id (Bun nativo) — 64MB memória, 2 iterações
- Rate limiting in-memory por IP+rota
- Refresh tokens com rotação: cada uso gera novo par e invalida o anterior
- Índices na DB: `users.email`, `user_library.user_id`, `refresh_tokens.token`, `refresh_tokens.user_id`
- Error handler global — nunca expõe stack traces em produção

## Elysia 1.4.x — Nota Importante

O Elysia 1.4.x tem um comportamento de singleton com plugins nomeados: o `onBeforeHandle` de um plugin nomeado só propaga na segunda utilização. Solução usada: adicionar `onBeforeHandle` diretamente na instância do router (não dentro do plugin).

## Comandos

```bash
bun run dev          # Servidor em modo watch
bun test             # Executar 22 testes
bun run db:push      # Aplicar schema à DB
bun run db:generate  # Gerar migrações SQL
```
