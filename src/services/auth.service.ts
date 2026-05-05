import { db, users } from "../config/db";
import { eq } from "drizzle-orm";

/**
 * AUTH SERVICE
 * Lógica de negócio para autenticação e gestão de contas.
 */
export const AuthService = {
  /**
   * PROCURAR UTILIZADOR POR EMAIL
   */
  async findUserByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  },

  /**
   * CRIAR NOVO UTILIZADOR
   * Realiza o hash da password e define a role padrão.
   */
  async createUser(data: typeof users.$inferInsert) {
    // 1. Encriptar a password antes de guardar
    const hashedPassword = await Bun.password.hash(data.password);

    // 2. Inserir na base de dados
    const [newUser] = await db
      .insert(users)
      .values({
        ...data,
        password: hashedPassword,
        role: data.role || "user",
      })
      .returning();

    return newUser;
  },

  /**
   * VERIFICAR PASSWORD
   * Compara o texto simples com o hash guardado.
   */
  async verifyPassword(password: string, hash: string) {
    return await Bun.password.verify(password, hash);
  },

  /**
   * PROCURAR UTILIZADOR POR ID
   */
  async findUserById(id: number) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  },
};
