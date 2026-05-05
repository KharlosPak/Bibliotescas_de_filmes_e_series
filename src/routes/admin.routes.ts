import { Elysia, t } from "elysia";
import { db, contents } from "../config/db";
import { authGuard } from "../middlewares/auth.guard";
import { eq } from "drizzle-orm";

export const adminRoutes = new Elysia({ prefix: "/admin" })
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
  })

  .get("/content", async () => {
    return await db.select().from(contents);
  })

  .post(
    "/content",
    async ({ body, set }) => {
      try {
        const [newContent] = await db
          .insert(contents)
          .values({
            title: body.title,
            type: body.type,
            genre: body.genre,
            synopsis: body.synopsis,
            releaseYear: body.releaseYear,
          })
          .returning();

        set.status = 201;
        return {
          message: "Conteúdo adicionado com sucesso!",
          data: newContent,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Erro ao adicionar conteúdo ao catálogo." };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        type: t.Union([t.Literal("movie"), t.Literal("series")]),
        genre: t.Optional(t.String()),
        synopsis: t.Optional(t.String()),
        releaseYear: t.Optional(t.Integer()),
      }),
    },
  )

  .put(
    "/content/:id",
    async ({ params, body, set }) => {
      const id = parseInt(params.id);

      const [updated] = await db
        .update(contents)
        .set(body)
        .where(eq(contents.id, id))
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: "Conteúdo não encontrado para atualizar." };
      }

      return { message: "Conteúdo atualizado!", data: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        title: t.Optional(t.String()),
        type: t.Optional(t.Union([t.Literal("movie"), t.Literal("series")])),
        genre: t.Optional(t.String()),
        synopsis: t.Optional(t.String()),
        releaseYear: t.Optional(t.Integer()),
      }),
    },
  )

  .delete(
    "/content/:id",
    async ({ params, set }) => {
      const id = parseInt(params.id);

      const [deleted] = await db
        .delete(contents)
        .where(eq(contents.id, id))
        .returning();

      if (!deleted) {
        set.status = 404;
        return { error: "Conteúdo não encontrado para remover." };
      }

      return { message: "Conteúdo removido com sucesso!" };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  );
