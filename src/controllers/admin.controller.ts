import { db, contents } from "../config/db";
import { eq } from "drizzle-orm";

/**
 * CONTROLADOR DE ADMINISTRAÇÃO
 * Concentra a lógica de manipulação do catálogo global.
 */
export const AdminController = {
  /**
   * ADICIONAR CONTEÚDO
   */
  async addContent({ body, set }: any) {
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
      return { error: "Erro interno ao salvar no catálogo." };
    }
  },

  /**
   * LISTAR TUDO (Para o painel do Admin)
   */
  async listAll({ set }: any) {
    try {
      const allContent = await db.select().from(contents);
      return allContent;
    } catch (error) {
      set.status = 500;
      return { error: "Erro ao listar catálogo." };
    }
  },

  /**
   * ATUALIZAR CONTEÚDO
   */
  async updateContent({ params, body, set }: any) {
    try {
      const id = parseInt(params.id);

      const [updated] = await db
        .update(contents)
        .set(body)
        .where(eq(contents.id, id))
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: "Conteúdo não encontrado para atualização." };
      }

      return {
        message: "Atualizado com sucesso!",
        data: updated,
      };
    } catch (error) {
      set.status = 500;
      return { error: "Erro ao atualizar conteúdo." };
    }
  },

  /**
   * ELIMINAR CONTEÚDO
   */
  async deleteContent({ params, set }: any) {
    try {
      const id = parseInt(params.id);

      const [deleted] = await db
        .delete(contents)
        .where(eq(contents.id, id))
        .returning();

      if (!deleted) {
        set.status = 404;
        return { error: "Conteúdo não encontrado no catálogo global." };
      }

      return { message: "Removido do catálogo global com sucesso!" };
    } catch (error) {
      set.status = 500;
      return { error: "Erro ao eliminar conteúdo." };
    }
  },
};
