import { Elysia, t } from "elysia";
import { AdminService } from "../services/admin.service";

export const catalogRoutes = new Elysia({ prefix: "/catalog", tags: ["Catálogo Público"] })

  .get(
    "/",
    async ({ query }) => {
      return await AdminService.searchCatalog({
        q: query.q,
        type: query.type as "movie" | "series" | undefined,
        genre: query.genre,
        year: query.year ? parseInt(query.year) : undefined,
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20,
      });
    },
    {
      query: t.Object({
        q: t.Optional(t.String({ description: "Pesquisar por título" })),
        type: t.Optional(t.Union([t.Literal("movie"), t.Literal("series")])),
        genre: t.Optional(t.String({ description: "Filtrar por género" })),
        year: t.Optional(t.String({ description: "Filtrar por ano de lançamento" })),
        page: t.Optional(t.String({ description: "Número da página (default: 1)" })),
        limit: t.Optional(t.String({ description: "Itens por página (max: 50, default: 20)" })),
      }),
      detail: {
        summary: "Pesquisar catálogo",
        description: "Endpoint público para pesquisa e filtragem do catálogo de filmes e séries.",
      },
    },
  )

  .get(
    "/:id",
    async ({ params, set }) => {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { error: "ID inválido." };
      }

      const content = await AdminService.findById(id);
      if (!content) {
        set.status = 404;
        return { error: "Conteúdo não encontrado." };
      }

      return content;
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Obter detalhes de um conteúdo",
        description: "Retorna os detalhes completos de um filme ou série pelo seu ID.",
      },
    },
  );
