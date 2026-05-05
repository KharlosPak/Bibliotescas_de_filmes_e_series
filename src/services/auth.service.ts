import { db, users, refreshTokens } from "../config/db";
import { eq, and, gt } from "drizzle-orm";
import { env } from "../config/env";
import { randomBytes } from "crypto";

export const AuthService = {
  async findUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  },

  async findUserById(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  },

  async createUser(data: { name: string; email: string; password: string }) {
    const hashedPassword = await Bun.password.hash(data.password, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 2,
    });
    const [newUser] = await db
      .insert(users)
      .values({ name: data.name, email: data.email, password: hashedPassword, role: "user" })
      .returning();
    return newUser;
  },

  async updateProfile(id: number, data: { name?: string; email?: string }) {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  },

  async updatePassword(id: number, newPassword: string) {
    const hashed = await Bun.password.hash(newPassword, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 2,
    });
    await db.update(users).set({ password: hashed }).where(eq(users.id, id));
  },

  async verifyPassword(password: string, hash: string) {
    try {
      return await Bun.password.verify(password, hash);
    } catch {
      return false;
    }
  },

  // REFRESH TOKENS
  async createRefreshToken(userId: number): Promise<string> {
    const token = randomBytes(64).toString("hex");
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000);
    await db.insert(refreshTokens).values({ userId, token, expiresAt });
    return token;
  },

  async findRefreshToken(token: string) {
    const [rt] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, token),
          eq(refreshTokens.revoked, false),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return rt;
  },

  async revokeRefreshToken(token: string) {
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.token, token));
  },

  async revokeAllUserTokens(userId: number) {
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, userId));
  },
};
