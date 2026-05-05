import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { env } from "./config/env";

import { authRoutes } from "./routes/auth.routes";
import { usersRoutes } from "./routes/user.routes";
import { adminRoutes } from "./routes/admin.routes";
import { catalogRoutes } from "./routes/catalog.routes";

const app = new Elysia()
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Streaming Library API",
          version: "2.0.0",
          description:
            "API para gestão de biblioteca pessoal de filmes e séries.\n\n" +
            "**Estados de visualização:**\n" +
            "- `to_watch` — Por Visualizar\n" +
            "- `watching` — A Visualizar\n" +
            "- `watched` — Visualizado\n\n" +
            "**Autenticação:** Bearer Token JWT (válido 14 min). Use `POST /auth/login` para obter o token e `POST /auth/refresh` para renová-lo.",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        tags: [
          { name: "Autenticação", description: "Registo, login, refresh token e gestão de perfil" },
          { name: "Catálogo Público", description: "Pesquisa e consulta do catálogo (sem autenticação)" },
          { name: "Biblioteca do Utilizador", description: "Gestão da biblioteca pessoal" },
          { name: "Administração", description: "Gestão do catálogo global (apenas administradores)" },
        ],
      },
    }),
  )

  // ── Healthcheck ─────────────────────────────────────────────────────────────
  .get(
    "/",
    () => ({
      name: "Streaming Library API",
      version: "2.0.0",
      status: "Online",
      docs: "/swagger",
      endpoints: {
        auth: "/auth",
        catalog: "/catalog",
        library: "/users/library",
        admin: "/admin/content",
      },
    }),
    { detail: { summary: "Healthcheck", tags: ["Autenticação"] } },
  )

  // ── Rotas ───────────────────────────────────────────────────────────────────
  .use(authRoutes)
  .use(usersRoutes)
  .use(adminRoutes)
  .use(catalogRoutes)

  // ── Handler de erros global ─────────────────────────────────────────────────
  .onError(({ code, error, set }) => {
    if (env.NODE_ENV !== "production") {
      console.error(`[${code}]`, error);
    }

    if (code === "VALIDATION") {
      set.status = 422;
      return {
        error: "Dados inválidos",
        message: "Os dados fornecidos não são válidos. Verifica os campos e tenta novamente.",
        details: error.message,
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Not Found", message: "Rota não encontrada." };
    }

    if (code === "PARSE") {
      set.status = 400;
      return { error: "Bad Request", message: "Corpo da requisição inválido ou mal formatado." };
    }

    set.status = 500;
    return {
      error: "Internal Server Error",
      message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
    };
  })

  .listen({ port: env.PORT, hostname: "0.0.0.0" });

console.log(`\n🚀 Servidor a correr em http://0.0.0.0:${app.server?.port}`);
console.log(`📚 Documentação: http://0.0.0.0:${app.server?.port}/swagger\n`);
