import { db, userLibrary, contents } from "../config/db";
import { eq, and } from "drizzle-orm";

/**
 * USER SERVICE
 * Gere a biblioteca pessoal e interações do utilizador com o catálogo.
 */
export const UserService = {
  /**
   * OBTER BIBLIOTECA DO UTILIZADOR
   * Realiza um Inner Join para trazer os dados do filme/série.
   */
  async getUserLibrary(userId: number) {
    return await db
      .select({
        id: contents.id,
        title: contents.title,
        type: contents.type,
        genre: contents.genre,
        synopsis: contents.synopsis,
        watched: userLibrary.watched,
        addedAt: userLibrary.addedAt,
      })
      .from(userLibrary)
      .innerJoin(contents, eq(userLibrary.contentId, contents.id))
      .where(eq(userLibrary.userId, userId));
  },

  /**
   * ADICIONAR CONTEÚDO À BIBLIOTECA
   */
  async addToLibrary(userId: number, contentId: number) {
    const [entry] = await db
      .insert(userLibrary)
      .values({
        userId,
        contentId,
        watched: false,
      })
      .returning();

    return entry;
  },

  /**
   * ATUALIZAR ESTADO DE VISUALIZAÇÃO
   */
  async updateWatchStatus(userId: number, contentId: number, watched: boolean) {
    const [updated] = await db
      .update(userLibrary)
      .set({ watched })
      .where(
        and(
          eq(userLibrary.userId, userId),
          eq(userLibrary.contentId, contentId),
        ),
      )
      .returning();

    return updated;
  },

  /**
   * REMOVER DA BIBLIOTECA
   */
  async removeFromLibrary(userId: number, contentId: number) {
    const [deleted] = await db
      .delete(userLibrary)
      .where(
        and(
          eq(userLibrary.userId, userId),
          eq(userLibrary.contentId, contentId),
        ),
      )
      .returning();

    return deleted;
  },

  /**
   * VERIFICAR SE JÁ EXISTE NA BIBLIOTECA
   */
  async checkInLibrary(userId: number, contentId: number) {
    const [exists] = await db
      .select()
      .from(userLibrary)
      .where(
        and(
          eq(userLibrary.userId, userId),
          eq(userLibrary.contentId, contentId),
        ),
      )
      .limit(1);

    return exists;
  },
};
