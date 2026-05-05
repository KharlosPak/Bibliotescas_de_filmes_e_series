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

// Define os cargos do sistema
export const roleEnum = pgEnum("role", ["user", "admin"]);

// Define se o conteúdo é um Filme ou uma Série
export const contentTypeEnum = pgEnum("content_type", ["movie", "series"]);

/**
 * TABELAS
 */

// Tabela de Utilizadores
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela de Conteúdo (Catálogo Global de Filmes e Séries)
export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: contentTypeEnum("type").notNull(),
  genre: varchar("genre", { length: 100 }),
  synopsis: text("synopsis"),
  releaseYear: integer("release_year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela de Biblioteca do Utilizador (Watchlist / Histórico)
// Esta tabela faz a ligação Many-to-Many entre Users e Contents
export const userLibrary = pgTable("user_library", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  contentId: integer("content_id")
    .references(() => contents.id, { onDelete: "cascade" })
    .notNull(),
  // false = Pendente (Watchlist), true = Já Visualizado
  watched: boolean("watched").default(false).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});
