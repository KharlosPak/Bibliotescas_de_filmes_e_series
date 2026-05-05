import { Elysia, t } from "elysia";
import { db, contents } from "../config/db"; // Ajustado para o teu caminho de importação
import { adminGuard } from "../middlewares/admin.guard";
import { eq } from "drizzle-orm";

/**
 * ROTAS DE ADMINISTRAÇÃO
 * Gerência do catálogo global de filmes e séries.
 */
export const adminRoutes = new Elysia({ prefix: "/admin" })
  // Aplica a verificação de Admin (podes comentar para testar sem token)
  .use(adminGuard)

  /**
   * LISTAR TODO O CATÁLOGO (Painel do Admin)
   */
  .get("/content", async () => {
    return await db.select().from(contents);
  })

  /**
   * ADICIONAR CONTEÚDO
   */
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

  /**
   * EDITAR CONTEÚDO
   */
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

  /**
   * ELIMINAR CONTEÚDO
   */
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
