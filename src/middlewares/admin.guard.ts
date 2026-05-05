import { Elysia } from "elysia";
import { authGuard } from "./auth.guard";

export const adminGuard = new Elysia({ name: "middleware.admin" })
  .use(authGuard)
  .onBeforeHandle(({ userRole, set }) => {
    // 1. O authGuard já injeta 'userRole' diretamente no contexto via .derive
    // Não precisas de user?.role se o teu derive retorna userRole

    if (userRole !== "admin") {
      set.status = 403;

      // O return é obrigatório para interromper a execução
      return {
        error: "Forbidden",
        message:
          "Acesso negado. Esta funcionalidade é exclusiva para administradores.",
        code: "ADMIN_REQUIRED",
      };
    }

    // Se for admin, o Elysia continua automaticamente
  });
