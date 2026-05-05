import { db, contents } from "../config/db";
import { eq, ilike, and, sql } from "drizzle-orm";

export type ContentType = "movie" | "series";

export const AdminService = {
  async createContent(data: typeof contents.$inferInsert) {
    const [newContent] = await db.insert(contents).values(data).returning();
    return newContent;
  },

  async updateContent(id: number, data: Partial<typeof contents.$inferInsert>) {
    const [updated] = await db
      .update(contents)
      .set(data)
      .where(eq(contents.id, id))
      .returning();
    return updated;
  },

  async deleteContent(id: number) {
    const [deleted] = await db.delete(contents).where(eq(contents.id, id)).returning();
    return deleted;
  },

  async getAllContent() {
    return await db.select().from(contents);
  },

  async findById(id: number) {
    const [content] = await db.select().from(contents).where(eq(contents.id, id)).limit(1);
    return content;
  },

  async searchCatalog(params: {
    q?: string;
    type?: ContentType;
    genre?: string;
    year?: number;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (params.q) conditions.push(ilike(contents.title, `%${params.q}%`));
    if (params.type) conditions.push(eq(contents.type, params.type));
    if (params.genre) conditions.push(ilike(contents.genre, `%${params.genre}%`));
    if (params.year) conditions.push(eq(contents.releaseYear, params.year));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(contents)
        .where(whereClause)
        .orderBy(contents.title)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contents)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },
};
