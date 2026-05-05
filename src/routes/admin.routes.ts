import { Elysia, t } from "elysia";
import { authGuard } from "../middlewares/auth.guard";
import { AdminService } from "../services/admin.service";

export const adminRoutes = new Elysia({ prefix: "/admin", tags: ["Administração"] })
  .use(authGuard)
  .onBeforeHandle(({ userRole, set }: any) => {
    if (userRole !== "admin") {
      set.status = 403;
      return {
        error: "Forbidden",
        message: "Acesso negado. Esta funcionalidade é exclusiva para administradores.",
        code: "ADMIN_REQUIRED",
      };
    }
  })

  .get(
    "/content",
    async () => {
      return await AdminService.getAllContent();
    },
    {
      detail: { summary: "Listar todo o catálogo (Admin)", security: [{ bearerAuth: [] }] },
    },
  )

  .post(
    "/content",
    async ({ body, set }) => {
      const newContent = await AdminService.createContent(body as any);
      set.status = 201;
      return { message: "Conteúdo adicionado ao catálogo!", data: newContent };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        type: t.Union([t.Literal("movie"), t.Literal("series")]),
        genre: t.Optional(t.String()),
        synopsis: t.Optional(t.String()),
        imageUrl: t.Optional(t.String({ description: "URL da capa/poster" })),
        releaseYear: t.Optional(t.Integer({ minimum: 1888, maximum: 2100 })),
      }),
      detail: { summary: "Adicionar conteúdo ao catálogo", security: [{ bearerAuth: [] }] },
    },
  )

  .put(
    "/content/:id",
    async ({ params, body, set }) => {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { error: "ID inválido." };
      }

      const updated = await AdminService.updateContent(id, body as any);
      if (!updated) {
        set.status = 404;
        return { error: "Conteúdo não encontrado." };
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
        imageUrl: t.Optional(t.String()),
        releaseYear: t.Optional(t.Integer({ minimum: 1888, maximum: 2100 })),
      }),
      detail: { summary: "Editar conteúdo", security: [{ bearerAuth: [] }] },
    },
  )

  .delete(
    "/content/:id",
    async ({ params, set }) => {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { error: "ID inválido." };
      }

      const deleted = await AdminService.deleteContent(id);
      if (!deleted) {
        set.status = 404;
        return { error: "Conteúdo não encontrado." };
      }

      return { message: "Conteúdo removido do catálogo." };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { summary: "Remover conteúdo do catálogo", security: [{ bearerAuth: [] }] },
    },
  );
