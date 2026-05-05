import { db, users } from "../config/db";
import { eq } from "drizzle-orm";

/**
 * CONTROLADOR DE AUTENTICAÇÃO
 * Responsável pelo fluxo de acesso, segurança e identidade.
 */
export const AuthController = {
  /**
   * REGISTO DE UTILIZADOR
   */
  async register({ body, set }: any) {
    try {
      const { name, email, password } = body;

      // 1. Verificar se o utilizador já existe
      // Usamos select().limit(1) para performance
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        set.status = 400;
        return { error: "Este email já está em uso." };
      }

      // 2. Hash da password (segurança nativa do Bun)
      const hashedPassword = await Bun.password.hash(password);

      // 3. Inserção
      await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role: "user",
      });

      set.status = 201;
      return { message: "Utilizador registado com sucesso!" };
    } catch (error) {
      set.status = 500;
      return { error: "Erro interno ao processar o registo." };
    }
  },

  /**
   * LOGIN
   */
  async login({ body, jwt, set }: any) {
    try {
      const { email, password } = body;

      // 1. Procurar utilizador
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      // 2. Validar existência e password
      if (!user) {
        set.status = 401;
        return { error: "Credenciais inválidas." };
      }

      const isPasswordValid = await Bun.password.verify(
        password,
        user.password,
      );
      if (!isPasswordValid) {
        set.status = 401;
        return { error: "Credenciais inválidas." };
      }

      // 3. Gerar JWT
      // O 'sub' é o padrão (Subject) para IDs em tokens JWT
      const token = await jwt.sign({
        sub: String(user.id),
        role: user.role,
      });

      return {
        message: "Login efetuado!",
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      set.status = 500;
      return { error: "Erro ao tentar efetuar login." };
    }
  },

  /**
   * OBTER PERFIL ATUAL
   */
  async getMe({ userId, set }: any) {
    try {
      if (!userId) {
        set.status = 401;
        return { error: "Sessão inválida ou expirada." };
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(userId)))
        .limit(1);

      if (!user) {
        set.status = 404;
        return { error: "Utilizador não encontrado." };
      }

      // Remover a password do retorno (sempre!)
      const { password: _, ...profile } = user;
      return profile;
    } catch (error) {
      set.status = 500;
      return { error: "Erro ao recuperar perfil." };
    }
  },
};
