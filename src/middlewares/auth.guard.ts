import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { env } from "../config/env";

/**
 * AUTH GUARD
 * Responsável por verificar o Token JWT e injetar os dados do utilizador no contexto.
 */
export const authGuard = new Elysia({ name: "middleware.auth" })
  .use(bearer())
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      schema: t.Object({
        userId: t.Optional(t.Numeric()),
        sub: t.Optional(t.String()),
        role: t.Optional(t.String()),
        userRole: t.Optional(t.String()),
      }),
    }),
  )
  /**
   * O 'derive' extrai os dados do token e torna-os disponíveis para as rotas.
   * Usamos 'as: "global"' para que os campos userId e userRole fiquem
   * visíveis para outros middlewares (como o adminGuard).
   */
  .derive({ as: "global" }, async ({ jwt, bearer }) => {
    if (!bearer) {
      return {
        userId: null as number | null,
        userRole: null as string | null,
      };
    }

    const payload = await jwt.verify(bearer);

    // Verificação do payload (suporte para 'userId' ou o padrão 'sub' do JWT)
    if (!payload || (!payload.userId && !payload.sub)) {
      return {
        userId: null as number | null,
        userRole: null as string | null,
      };
    }

    const id = payload.userId || payload.sub;

    return {
      userId: id ? Number(id) : null,
      userRole: (payload.role || payload.userRole || "user") as string,
    };
  })
  /**
   * Bloqueio imediato para qualquer rota que utilize o authGuard
   * caso o token seja inválido ou inexistente.
   */
  .onBeforeHandle(({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message:
          "Não autorizado. Por favor, faça login para aceder a este recurso.",
      };
    }
  });

/**
 * ADMIN GUARD
 * Estende o authGuard para validar se o utilizador tem permissões de administrador.
 *
 * NOTA: O uso de ': any' no contexto resolve o erro de sublinhado do TypeScript
 * quando o Elysia demora a processar tipos derivados complexos.
 */
export const adminGuard = new Elysia({ name: "middleware.admin" })
  .use(authGuard)
  .onBeforeHandle(({ userRole, set }: any) => {
    if (userRole !== "admin") {
      set.status = 403;
      return {
        error: "Forbidden",
        message:
          "Acesso negado. Esta operação requer privilégios de Administrador.",
        code: "ADMIN_REQUIRED",
      };
    }
  });
