import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { env } from "../config/env";

export const authGuard = new Elysia({ name: "middleware.auth" })
  .use(bearer())
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      schema: t.Object({
        sub: t.Optional(t.String()),
        role: t.Optional(t.String()),
        exp: t.Optional(t.Number()),
      }),
    }),
  )
  .derive({ as: "global" }, async ({ jwt, bearer }) => {
    if (!bearer) {
      return { userId: null as number | null, userRole: null as string | null };
    }

    const payload = await jwt.verify(bearer);

    if (!payload || !payload.sub) {
      return { userId: null as number | null, userRole: null as string | null };
    }

    // Verificar expiração manual (compatibilidade)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { userId: null as number | null, userRole: null as string | null };
    }

    return {
      userId: Number(payload.sub),
      userRole: (payload.role || "user") as string,
    };
  })
  .onBeforeHandle(({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "Token inválido, expirado ou não fornecido. Faça login novamente.",
      };
    }
  });
