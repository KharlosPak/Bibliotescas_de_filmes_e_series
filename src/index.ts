import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { env } from "./config/env";

// Importação dos grupos de rotas
import { authRoutes } from "./routes/auth.routes";
import { usersRoutes } from "./routes/user.routes";
import { adminRoutes } from "./routes/admin.routes";

// DEBUG DE CONEXÃO
console.log("--- DEBUG DE AMBIENTE ---");
console.log(
  "Variável DATABASE_URL (via env):",
  env.DATABASE_URL?.split("@")[1] || "NÃO ENCONTRADA",
);
console.log(
  "Variável DATABASE_URL (via process.env):",
  process.env.DATABASE_URL?.split("@")[1] || "NÃO ENCONTRADA",
);
console.log(
  "Utilizador do Sistema (whoami):",
  process.env.USER || process.env.USERNAME,
);
console.log("-------------------------");

// Inicialização da aplicação
const app = new Elysia()
  // 1. Middlewares Globais
  .use(cors()) // Permite que o Frontend (React/Vue/Angular) comunique com a API
  .use(
    swagger({
      documentation: {
        info: {
          title: "Streaming API",
          version: "1.0.0",
          description:
            "API para gestão de catálogo e bibliotecas pessoais de filmes e séries.",
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
      },
    }),
  )

  // 2. Rota de Healthcheck (Raiz)
  .get("/", () => {
    return {
      status: "Online",
      message: "Bem-vindo à Streaming API!",
      docs: "/swagger", // Indica onde a documentação está
    };
  })

  // 3. Montagem dos Controladores/Rotas
  .use(authRoutes) // Rotas: /auth/register, /auth/login, /auth/me
  .use(usersRoutes) // Rotas: /users/library...
  .use(adminRoutes) // Rotas: /admin/content...

  // 4. Iniciar o Servidor
  .listen(env.PORT);

// Mensagens de Sucesso no Terminal
console.log(
  ` Servidor a correr em http://${app.server?.hostname}:${app.server?.port}`,
);
console.log(
  ` Documentação Interativa em http://${app.server?.hostname}:${app.server?.port}/swagger`,
);
