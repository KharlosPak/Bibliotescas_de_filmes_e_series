import { Elysia, t } from "elysia";
import { authGuard } from "../middlewares/auth.guard";
import { rateLimit } from "../middlewares/rate-limit";
import { AuthService } from "../services/auth.service";
import { env } from "../config/env";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

export const authRoutes = new Elysia({ prefix: "/auth", tags: ["Autenticação"] })

  // ── Rotas públicas ──────────────────────────────────────────────────────────
  .post(
    "/register",
    async ({ body, set }) => {
      const existing = await AuthService.findUserByEmail(body.email);
      if (existing) {
        set.status = 409;
        return { error: "Este email já está em uso." };
      }
      await AuthService.createUser(body);
      set.status = 201;
      return { message: "Conta criada com sucesso! Podes fazer login agora." };
    },
    {
      beforeHandle: rateLimit({ max: 10, windowMs: ONE_HOUR, message: "Demasiados registos. Tente novamente em 1 hora." }),
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 100 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
      }),
      detail: { summary: "Criar nova conta" },
    },
  )

  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const user = await AuthService.findUserByEmail(body.email);
      if (!user || !(await AuthService.verifyPassword(body.password, user.password))) {
        set.status = 401;
        return { error: "Credenciais inválidas." };
      }

      const now = Math.floor(Date.now() / 1000);
      const accessToken = await jwt.sign({
        sub: String(user.id),
        role: user.role,
        exp: now + env.JWT_EXPIRES_IN_SECONDS,
      });
      const refreshToken = await AuthService.createRefreshToken(user.id);

      return {
        message: "Login efetuado com sucesso!",
        accessToken,
        refreshToken,
        expiresIn: env.JWT_EXPIRES_IN_SECONDS,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      };
    },
    {
      beforeHandle: rateLimit({ max: 10, windowMs: FIFTEEN_MINUTES, message: "Demasiadas tentativas de login. Tente novamente em 15 minutos." }),
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
      detail: { summary: "Iniciar sessão" },
    },
  )

  .post(
    "/refresh",
    async ({ body, jwt, set }) => {
      const rt = await AuthService.findRefreshToken(body.refreshToken);
      if (!rt) {
        set.status = 401;
        return { error: "Refresh token inválido ou expirado." };
      }

      const user = await AuthService.findUserById(rt.userId);
      if (!user) {
        set.status = 401;
        return { error: "Utilizador não encontrado." };
      }

      await AuthService.revokeRefreshToken(body.refreshToken);
      const now = Math.floor(Date.now() / 1000);
      const accessToken = await jwt.sign({
        sub: String(user.id),
        role: user.role,
        exp: now + env.JWT_EXPIRES_IN_SECONDS,
      });
      const newRefreshToken = await AuthService.createRefreshToken(user.id);

      return {
        message: "Token renovado com sucesso!",
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: env.JWT_EXPIRES_IN_SECONDS,
      };
    },
    {
      beforeHandle: rateLimit({ max: 20, windowMs: FIFTEEN_MINUTES }),
      body: t.Object({ refreshToken: t.String() }),
      detail: { summary: "Renovar access token usando refresh token" },
    },
  )

  // ── Rotas protegidas por JWT ─────────────────────────────────────────────────
  .use(authGuard)

  .post(
    "/logout",
    async ({ body, userId }) => {
      if (body?.refreshToken) {
        await AuthService.revokeRefreshToken(body.refreshToken);
      } else {
        await AuthService.revokeAllUserTokens(userId!);
      }
      return { message: "Sessão terminada com sucesso." };
    },
    {
      body: t.Optional(t.Object({ refreshToken: t.Optional(t.String()) })),
      detail: { summary: "Terminar sessão atual", security: [{ bearerAuth: [] }] },
    },
  )

  .post(
    "/logout-all",
    async ({ userId }) => {
      await AuthService.revokeAllUserTokens(userId!);
      return { message: "Todas as sessões foram terminadas com sucesso." };
    },
    {
      detail: {
        summary: "Terminar todas as sessões",
        description: "Revoga todos os refresh tokens ativos do utilizador em todos os dispositivos.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .get(
    "/me",
    async ({ userId, set }) => {
      if (!userId) {
        set.status = 401;
        return { error: "Não autorizado." };
      }
      const user = await AuthService.findUserById(userId);
      if (!user) {
        set.status = 404;
        return { error: "Utilizador não encontrado." };
      }
      const { password: _, ...profile } = user;
      return profile;
    },
    {
      detail: { summary: "Obter perfil do utilizador autenticado", security: [{ bearerAuth: [] }] },
    },
  )

  .patch(
    "/me",
    async ({ userId, body, set }) => {
      if (!userId) {
        set.status = 401;
        return { error: "Não autorizado." };
      }
      if (body.email) {
        const existing = await AuthService.findUserByEmail(body.email);
        if (existing && existing.id !== userId) {
          set.status = 409;
          return { error: "Este email já está em uso." };
        }
      }
      const updated = await AuthService.updateProfile(userId, body);
      if (!updated) {
        set.status = 404;
        return { error: "Utilizador não encontrado." };
      }
      const { password: _, ...profile } = updated;
      return { message: "Perfil atualizado!", user: profile };
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
        email: t.Optional(t.String({ format: "email" })),
      }),
      detail: { summary: "Atualizar nome ou email", security: [{ bearerAuth: [] }] },
    },
  )

  .patch(
    "/me/password",
    async ({ userId, body, set }) => {
      if (!userId) {
        set.status = 401;
        return { error: "Não autorizado." };
      }
      const user = await AuthService.findUserById(userId);
      if (!user) {
        set.status = 404;
        return { error: "Utilizador não encontrado." };
      }
      const valid = await AuthService.verifyPassword(body.currentPassword, user.password);
      if (!valid) {
        set.status = 400;
        return { error: "Password atual incorreta." };
      }
      await AuthService.updatePassword(userId, body.newPassword);
      await AuthService.revokeAllUserTokens(userId);
      return { message: "Password alterada! Por favor, faça login novamente." };
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String({ minLength: 8 }),
      }),
      detail: { summary: "Alterar password", security: [{ bearerAuth: [] }] },
    },
  );
