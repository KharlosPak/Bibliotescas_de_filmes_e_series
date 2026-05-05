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
        userId: t.Optional(t.Numeric()),
        sub: t.Optional(t.String()),
        role: t.Optional(t.String()),
        userRole: t.Optional(t.String()),
      }),
    }),
  )
  .derive({ as: "global" }, async ({ jwt, bearer }) => {
    if (!bearer) {
      return {
        userId: null as number | null,
        userRole: null as string | null,
      };
    }

    const payload = await jwt.verify(bearer);

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
