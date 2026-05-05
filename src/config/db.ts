import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

/**
 * CONFIGURAÇÃO DA CONEXÃO
 * O Drizzle Kit e a API precisam desta URL para comunicar com o PostgreSQL.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Erro: DATABASE_URL não definida!");
  throw new Error(
    "A variável de ambiente DATABASE_URL não foi encontrada. Verifique o seu ficheiro .env",
  );
}

/**
 * CLIENTE POSTGRES (Driver)
 * 'prepare: false' é essencial se usares Supabase ou ferramentas de Proxy/Pooling.
 */
const client = postgres(connectionString, {
  prepare: false,
  // Opcional: Define um limite de conexões se o Postgres for local
  max: 10,
});

/**
 * INSTÂNCIA DO DRIZZLE ORM
 * Passamos o 'schema' aqui para habilitar o 'db.query', que usamos nas tuas rotas.
 */
export const db = drizzle(client, { schema });

/**
 * EXPORTAÇÃO UNIFICADA
 * Isto permite que faças: import { db, users, contents } from "../config/db";
 */
export * from "../db/schema";

console.log("✅ Ligação ao PostgreSQL configurada com sucesso.");
