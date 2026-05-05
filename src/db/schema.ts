import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const contentTypeEnum = pgEnum("content_type", ["movie", "series"]);
export const watchStatusEnum = pgEnum("watch_status", [
  "to_watch",
  "watching",
  "watched",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: contentTypeEnum("type").notNull(),
  genre: varchar("genre", { length: 100 }),
  synopsis: text("synopsis"),
  imageUrl: varchar("image_url", { length: 500 }),
  releaseYear: integer("release_year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userLibrary = pgTable("user_library", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  contentId: integer("content_id")
    .references(() => contents.id, { onDelete: "cascade" })
    .notNull(),
  status: watchStatusEnum("status").default("to_watch").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
