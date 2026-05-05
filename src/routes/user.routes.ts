import { Elysia, t } from "elysia";
import { db, userLibrary, contents } from "../config/db";
import { authGuard } from "../middlewares/auth.guard";
import { eq, and } from "drizzle-orm";

/**
 * ROTAS DE UTILIZADOR
 * Gestão da biblioteca pessoal e consulta de conteúdos.
 */
export const usersRoutes = new Elysia({ prefix: "/users" })
  .use(authGuard)

  /**
   * LISTAR MINHA BIBLIOTECA
   * Retorna os conteúdos da lista do utilizador com os nomes e detalhes.
   */
  .get("/library", async ({ userId, set }) => {
    try {
      if (!userId) {
        set.status = 401;
        return { error: "Utilizador não identificado." };
      }

      // Fazemos um Join para trazer os dados do conteúdo junto com o estado 'visto'
      const library = await db
        .select({
          id: contents.id,
          title: contents.title,
          type: contents.type,
          genre: contents.genre,
          watched: userLibrary.watched,
          addedAt: userLibrary.addedAt,
        })
        .from(userLibrary)
        .innerJoin(contents, eq(userLibrary.contentId, contents.id))
        .where(eq(userLibrary.userId, Number(userId)));

      return library;
    } catch (error) {
      set.status = 500;
      return { error: "Erro ao carregar a biblioteca." };
    }
  })

  /**
   * ADICIONAR À BIBLIOTECA
   */
  .post(
    "/library",
    async ({ userId, body, set }) => {
      const { contentId } = body;

      // 1. Verificar se o conteúdo existe no catálogo global
      const [contentExists] = await db
        .select()
        .from(contents)
        .where(eq(contents.id, contentId))
        .limit(1);

      if (!contentExists) {
        set.status = 404;
        return { error: "Conteúdo não encontrado no catálogo." };
      }

      // 2. Verificar duplicados na biblioteca do user
      const [alreadyInLibrary] = await db
        .select()
        .from(userLibrary)
        .where(
          and(
            eq(userLibrary.userId, Number(userId)),
            eq(userLibrary.contentId, contentId),
          ),
        )
        .limit(1);

      if (alreadyInLibrary) {
        set.status = 400;
        return { error: "Este conteúdo já está na tua biblioteca." };
      }

      // 3. Inserir
      await db.insert(userLibrary).values({
        userId: Number(userId),
        contentId,
        watched: false,
      });

      set.status = 201;
      return { message: "Adicionado à tua lista com sucesso!" };
    },
    {
      body: t.Object({
        contentId: t.Integer(),
      }),
    },
  )

  /**
   * ATUALIZAR STATUS (Visto/Não Visto)
   */
  .patch(
    "/library/:contentId",
    async ({ userId, params, body, set }) => {
      const contentId = parseInt(params.contentId);

      const updated = await db
        .update(userLibrary)
        .set({ watched: body.watched })
        .where(
          and(
            eq(userLibrary.userId, Number(userId)),
            eq(userLibrary.contentId, contentId),
          ),
        )
        .returning();

      if (updated.length === 0) {
        set.status = 404;
        return { error: "Conteúdo não encontrado na tua biblioteca." };
      }

      return {
        message: `Estado atualizado para: ${body.watched ? "Visto" : "Pendente"}`,
      };
    },
    {
      params: t.Object({ contentId: t.String() }),
      body: t.Object({ watched: t.Boolean() }),
    },
  )

  /**
   * REMOVER DA BIBLIOTECA
   */
  .delete(
    "/library/:contentId",
    async ({ userId, params, set }) => {
      const contentId = parseInt(params.contentId);

      const deleted = await db
        .delete(userLibrary)
        .where(
          and(
            eq(userLibrary.userId, Number(userId)),
            eq(userLibrary.contentId, contentId),
          ),
        )
        .returning();

      if (deleted.length === 0) {
        set.status = 404;
        return { error: "Conteúdo não estava na tua biblioteca." };
      }

      return { message: "Removido da tua biblioteca." };
    },
    {
      params: t.Object({ contentId: t.String() }),
    },
  );
