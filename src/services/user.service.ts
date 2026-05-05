import { db, userLibrary, contents } from "../config/db";
import { eq, and, sql } from "drizzle-orm";

export type WatchStatus = "to_watch" | "watching" | "watched";

export const UserService = {
  async getUserLibrary(userId: number, statusFilter?: WatchStatus) {
    const query = db
      .select({
        libraryId: userLibrary.id,
        contentId: contents.id,
        title: contents.title,
        type: contents.type,
        genre: contents.genre,
        synopsis: contents.synopsis,
        imageUrl: contents.imageUrl,
        releaseYear: contents.releaseYear,
        status: userLibrary.status,
        addedAt: userLibrary.addedAt,
        updatedAt: userLibrary.updatedAt,
      })
      .from(userLibrary)
      .innerJoin(contents, eq(userLibrary.contentId, contents.id))
      .where(
        statusFilter
          ? and(eq(userLibrary.userId, userId), eq(userLibrary.status, statusFilter))
          : eq(userLibrary.userId, userId),
      );

    return await query;
  },

  async addToLibrary(userId: number, contentId: number, status: WatchStatus = "to_watch") {
    const [entry] = await db
      .insert(userLibrary)
      .values({ userId, contentId, status })
      .returning();
    return entry;
  },

  async updateStatus(userId: number, contentId: number, status: WatchStatus) {
    const [updated] = await db
      .update(userLibrary)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(userLibrary.userId, userId), eq(userLibrary.contentId, contentId)))
      .returning();
    return updated;
  },

  async removeFromLibrary(userId: number, contentId: number) {
    const [deleted] = await db
      .delete(userLibrary)
      .where(and(eq(userLibrary.userId, userId), eq(userLibrary.contentId, contentId)))
      .returning();
    return deleted;
  },

  async checkInLibrary(userId: number, contentId: number) {
    const [exists] = await db
      .select()
      .from(userLibrary)
      .where(and(eq(userLibrary.userId, userId), eq(userLibrary.contentId, contentId)))
      .limit(1);
    return exists;
  },

  async getStats(userId: number) {
    const rows = await db
      .select({
        status: userLibrary.status,
        count: sql<number>`count(*)::int`,
      })
      .from(userLibrary)
      .where(eq(userLibrary.userId, userId))
      .groupBy(userLibrary.status);

    const stats = { to_watch: 0, watching: 0, watched: 0, total: 0 };
    for (const row of rows) {
      stats[row.status] = row.count;
      stats.total += row.count;
    }
    return stats;
  },
};
