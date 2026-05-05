import { defineConfig } from "drizzle-kit";

/**
 * Configuração do Drizzle Kit para PostgreSQL
 * O 'dialect' é agora obrigatório em versões recentes.
 * Usamos 127.0.0.1 para evitar problemas de autenticação automática do SO.
 */
export default defineConfig({
  // Define o banco de dados como PostgreSQL
  dialect: "postgresql",

  // Caminho para o ficheiro onde definiste as tabelas (Users, Movies, etc.)
  schema: "./src/db/schema.ts",

  // Pasta onde o Drizzle vai gerar os ficheiros SQL de migração
  out: "./drizzle",

  // Credenciais de acesso
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:Paktchanow_07@127.0.0.1:5432/bibliotecas_db",
  },

  // Mostra logs detalhados no terminal e mantém o schema rigoroso
  verbose: true,
  strict: true,
});
