import { Elysia } from "elysia";
import { authGuard } from "./auth.guard";

export const adminGuard = new Elysia({ name: "middleware.admin" })
  .use(authGuard)
  .onBeforeHandle(({ userRole, set }: any) => {
    if (userRole !== "admin") {
      set.status = 403;
      return {
        error: "Forbidden",
        message:
          "Acesso negado. Esta funcionalidade é exclusiva para administradores.",
        code: "ADMIN_REQUIRED",
      };
    }
  });
