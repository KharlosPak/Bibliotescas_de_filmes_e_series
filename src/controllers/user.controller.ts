import { db, userLibrary, contents } from "../config/db";
import { eq, and } from "drizzle-orm";

/**
 * CONTROLADOR DE UTILIZADOR
 * Gere a biblioteca pessoal e interações com o catálogo.
 */
export const UserController = {
  /**
   * OBTER BIBLIOTECA PESSOAL
   * Retorna os filmes com detalhes (Join) e não apenas IDs.
   */
  async getLibrary({ userId, set }: any) {
    try {
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
      return { error: "Erro ao carregar a tua biblioteca." };
    }
  },

  /**
   * ADICIONAR CONTEÚDO À LISTA
   */
  async addToLibrary({ userId, body, set }: any) {
    try {
      const { contentId } = body;
      const uId = Number(userId);

      // 1. Verificar se já existe para evitar duplicados
      const [exists] = await db
        .select()
        .from(userLibrary)
        .where(
          and(
            eq(userLibrary.userId, uId),
            eq(userLibrary.contentId, contentId),
          ),
        )
        .limit(1);

      if (exists) {
        set.status = 400;
        return { error: "Este conteúdo já está na tua lista." };
      }

      // 2. Inserir na biblioteca
      await db.insert(userLibrary).values({
        userId: uId,
        contentId,
        watched: false,
      });

      set.status = 201;
      return { message: "Adicionado à tua biblioteca com sucesso!" };
    } catch (error) {
      set.status = 500;
      return { error: "Erro ao adicionar conteúdo." };
    }
  },

  /**
   * ALTERAR ESTADO (Visto / Pendente)
   */
  async toggleWatched({ userId, params, body, set }: any) {
    try {
      const contentId = parseInt(params.contentId);
      const uId = Number(userId);

      const [updated] = await db
        .update(userLibrary)
        .set({ watched: body.watched })
        .where(
          and(
            eq(userLibrary.userId, uId),
            eq(userLibrary.contentId, contentId),
          ),
        )
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: "Conteúdo não encontrado na tua biblioteca." };
      }

      return {
        message: `Estado atualizado: ${body.watched ? "Visualizado" : "Pendente"}`,
      };
    } catch (error) {
      set.status = 500;
      return { error: "Erro ao atualizar estado de visualização." };
    }
  },

  /**
   * REMOVER DA BIBLIOTECA
   */
  async removeFromLibrary({ userId, params, set }: any) {
    try {
      const contentId = parseInt(params.contentId);
      const uId = Number(userId);

      const [deleted] = await db
        .delete(userLibrary)
        .where(
          and(
            eq(userLibrary.userId, uId),
            eq(userLibrary.contentId, contentId),
          ),
        )
        .returning();

      if (!deleted) {
        set.status = 404;
        return { error: "Conteúdo não encontrado na tua lista." };
      }

      return { message: "Removido da biblioteca." };
    } catch (error) {
      set.status = 500;
      return { error: "Erro ao remover conteúdo." };
    }
  },
};
