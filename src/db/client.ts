import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * CONFIGURAÇÃO DO CLIENTE POSTGRESQL
 */

// Obtém a URL de conexão das variáveis de ambiente carregadas pelo Bun
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(" A variável DATABASE_URL não foi definida no ficheiro .env");
}

/**
 * O cliente 'postgres' gere o pool de conexões automaticamente.
 * 'prepare: false' é recomendado para ambientes de desenvolvimento com migrações frequentes
 * ou quando se utiliza ferramentas como o Supabase/PgBouncer.
 */
const client = postgres(connectionString, {
  prepare: false,
});

/**
 * Instância do Drizzle ORM
 * Passamos o objeto 'schema' para que o Drizzle tenha conhecimento das
 * nossas tabelas, enums e relações, permitindo o uso do 'db.query'.
 */
export const db = drizzle(client, { schema });

console.log(
  "✅ Conexão com o PostgreSQL estabelecida com sucesso via Drizzle.",
);
