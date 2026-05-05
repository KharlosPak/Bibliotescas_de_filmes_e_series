import { db, contents } from "../config/db";
import { eq } from "drizzle-orm";

/**
 * ADMIN SERVICE
 * Camada de persistência e lógica pura de dados.
 * Não sabe nada sobre 'set.status' ou 'params' do HTTP.
 */
export const AdminService = {
  /**
   * CRIAR NOVO CONTEÚDO
   */
  async createContent(data: typeof contents.$inferInsert) {
    const [newContent] = await db.insert(contents).values(data).returning();
    return newContent;
  },

  /**
   * ATUALIZAR CONTEÚDO EXISTENTE
   */
  async updateContent(id: number, data: Partial<typeof contents.$inferInsert>) {
    const [updated] = await db
      .update(contents)
      .set(data)
      .where(eq(contents.id, id))
      .returning();
    return updated;
  },

  /**
   * ELIMINAR DO CATÁLOGO
   */
  async deleteContent(id: number) {
    const [deleted] = await db
      .delete(contents)
      .where(eq(contents.id, id))
      .returning();
    return deleted;
  },

  /**
   * OBTER TODO O CATÁLOGO
   */
  async getAllContent() {
    // Usando select para consistência com o resto do projeto
    return await db.select().from(contents);
  },
};
