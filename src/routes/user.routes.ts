import { Elysia, t } from "elysia";
import { authGuard } from "../middlewares/auth.guard";
import { UserService } from "../services/user.service";
import { AdminService } from "../services/admin.service";

const watchStatusValues = ["to_watch", "watching", "watched"] as const;

export const usersRoutes = new Elysia({ prefix: "/users", tags: ["Biblioteca do Utilizador"] })
  .use(authGuard)
  .onBeforeHandle(({ userId, set }: any) => {
    if (!userId) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "Token inválido, expirado ou não fornecido. Faça login novamente.",
      };
    }
  })

  .get(
    "/stats",
    async ({ userId }) => {
      return await UserService.getStats(userId!);
    },
    {
      detail: {
        summary: "Estatísticas da biblioteca",
        description: "Retorna contagem de filmes/séries por estado: por visualizar, a visualizar e visualizado.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .get(
    "/library",
    async ({ userId, query, set }) => {
      const status = query.status as "to_watch" | "watching" | "watched" | undefined;
      if (status && !watchStatusValues.includes(status)) {
        set.status = 400;
        return { error: `Status inválido. Use: ${watchStatusValues.join(", ")}` };
      }
      return await UserService.getUserLibrary(userId!, status);
    },
    {
      query: t.Object({
        status: t.Optional(
          t.Union([t.Literal("to_watch"), t.Literal("watching"), t.Literal("watched")]),
        ),
      }),
      detail: {
        summary: "Listar biblioteca pessoal",
        description: "Retorna todos os conteúdos da biblioteca, com filtro opcional por estado.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/library",
    async ({ userId, body, set }) => {
      const content = await AdminService.findById(body.contentId);
      if (!content) {
        set.status = 404;
        return { error: "Conteúdo não encontrado no catálogo." };
      }

      const existing = await UserService.checkInLibrary(userId!, body.contentId);
      if (existing) {
        set.status = 409;
        return { error: "Este conteúdo já está na tua biblioteca." };
      }

      const entry = await UserService.addToLibrary(userId!, body.contentId, body.status ?? "to_watch");
      set.status = 201;
      return {
        message: "Adicionado à biblioteca com sucesso!",
        data: { ...entry, content: { id: content.id, title: content.title, type: content.type } },
      };
    },
    {
      body: t.Object({
        contentId: t.Integer({ minimum: 1 }),
        status: t.Optional(
          t.Union([t.Literal("to_watch"), t.Literal("watching"), t.Literal("watched")]),
        ),
      }),
      detail: {
        summary: "Adicionar à biblioteca",
        description: "Adiciona um filme ou série com o estado: 'to_watch' (por ver), 'watching' (a ver), 'watched' (visto).",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch(
    "/library/:contentId",
    async ({ userId, params, body, set }) => {
      const contentId = parseInt(params.contentId);
      if (isNaN(contentId)) {
        set.status = 400;
        return { error: "ID de conteúdo inválido." };
      }

      const updated = await UserService.updateStatus(userId!, contentId, body.status);
      if (!updated) {
        set.status = 404;
        return { error: "Conteúdo não encontrado na tua biblioteca." };
      }

      const labels: Record<string, string> = {
        to_watch: "Por Visualizar",
        watching: "A Visualizar",
        watched: "Visualizado",
      };

      return { message: `Estado atualizado para: ${labels[body.status]}`, data: updated };
    },
    {
      params: t.Object({ contentId: t.String() }),
      body: t.Object({
        status: t.Union([t.Literal("to_watch"), t.Literal("watching"), t.Literal("watched")]),
      }),
      detail: {
        summary: "Atualizar estado de visualização",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete(
    "/library/:contentId",
    async ({ userId, params, set }) => {
      const contentId = parseInt(params.contentId);
      if (isNaN(contentId)) {
        set.status = 400;
        return { error: "ID de conteúdo inválido." };
      }

      const deleted = await UserService.removeFromLibrary(userId!, contentId);
      if (!deleted) {
        set.status = 404;
        return { error: "Conteúdo não encontrado na tua biblioteca." };
      }

      return { message: "Removido da biblioteca com sucesso." };
    },
    {
      params: t.Object({ contentId: t.String() }),
      detail: {
        summary: "Remover da biblioteca",
        security: [{ bearerAuth: [] }],
      },
    },
  );
