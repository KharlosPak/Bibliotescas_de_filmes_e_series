import { Elysia, t } from "elysia";
import { db, users } from "../config/db";
import { authGuard } from "../middlewares/auth.guard";
import { eq } from "drizzle-orm";

/**
 * ROTAS DE AUTENTICAÇÃO
 * Gerencia o registo, login e validação de sessão.
 */
export const authRoutes = new Elysia({ prefix: "/auth" })
  // O authGuard injeta as configurações de JWT (sign, verify) e protege rotas se necessário
  .use(authGuard)

  /**
   * REGISTO DE UTILIZADOR
   */
  .post(
    "/register",
    async ({ body, set }) => {
      const { name, email, password } = body;

      try {
        // 1. Verificar se o email já existe
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          set.status = 400;
          return { error: "Este email já está em uso." };
        }

        // 2. Encriptar a senha usando a função nativa do Bun (Argon2 por padrão)
        const hashedPassword = await Bun.password.hash(password);

        // 3. Inserir no banco de dados
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
    {
      body: t.Object({
        name: t.String(),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
    },
  )

  /**
   * LOGIN
   * Valida credenciais e retorna o Token JWT.
   */
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      // 1. Procurar o utilizador
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        set.status = 401;
        return { error: "Credenciais inválidas (Email não encontrado)." };
      }

      // 2. Verificar a senha encriptada
      const isPasswordValid = await Bun.password.verify(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        set.status = 401;
        return { error: "Credenciais inválidas (Senha incorreta)." };
      }

      // 3. Gerar o Token JWT com os dados do utilizador
      const token = await jwt.sign({
        sub: String(user.id), // 'sub' é o padrão para o ID do sujeito no JWT
        role: user.role,
      });

      return {
        message: "Login efetuado com sucesso!",
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    },
  )

  /**
   * PERFIL (Rota Protegida)
   * Demonstração de como obter dados do utilizador logado.
   */
  .get("/me", async ({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Não autenticado." };
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

    // Remover a password do retorno por segurança
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
