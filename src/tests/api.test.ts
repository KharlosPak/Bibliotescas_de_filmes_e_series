import { expect, test, describe } from "bun:test";
import { db } from "../config/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:3000";

describe(" Suíte de Testes Integrais - Streaming API", () => {
  // Variáveis partilhadas entre testes
  let accessToken = "";
  let adminToken = "";
  const uniqueId = Date.now();

  const testUser = {
    name: "Utilizador Comum",
    email: `user_${uniqueId}@gmail.com`,
    password: "Password123!",
  };

  const adminUser = {
    name: "Admin System",
    email: `admin_${uniqueId}@gmail.com`,
    password: "AdminPassword123",
  };

  // --- BLOCO 1: AUTENTICAÇÃO ---
  describe(" Autenticação e Perfil", () => {
    test("Deve registar um utilizador comum", async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      });
      expect(res.status).toBe(201);
    });

    test("Deve falhar login com senha errada", async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testUser.email, password: "wrong" }),
      });
      expect(res.status).toBe(401);
    });

    test("Deve obter token no login", async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });
      const data: any = await res.json();
      accessToken = data.token;
      expect(res.status).toBe(200);
      expect(accessToken).toBeDefined();
    });
  });

  // --- BLOCO 2: BIBLIOTECA (USER) ---
  describe(" Biblioteca do Utilizador", () => {
    test("Deve bloquear acesso sem token", async () => {
      const res = await fetch(`${BASE_URL}/users/library`);
      expect(res.status).toBe(401);
    });

    test("Deve permitir acesso com token de utilizador", async () => {
      const res = await fetch(`${BASE_URL}/users/library`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res.status).toBe(200);
    });
  });

  // --- BLOCO 3: ADMINISTRADOR ---
  describe(" Gestão Administrativa", () => {
    test("Deve promover a Admin e criar conteúdo", async () => {
      // 1. Registo do Admin
      await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminUser),
      });

      // 2. Promoção na DB
      await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.email, adminUser.email));

      // 3. Login para pegar novo Token com Role 'admin'
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminUser.email,
          password: adminUser.password,
        }),
      });
      const loginData: any = await loginRes.json();
      adminToken = loginData.token;

      // 4. Testar acesso à rota protegida de Admin
      const adminRes = await fetch(`${BASE_URL}/admin/content`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Matrix",
          type: "movie",
          genre: "Sci-Fi",
        }),
      });

      expect(adminRes.status).toBe(201);
    });

    test("Utilizador comum não pode criar conteúdo (403)", async () => {
      const res = await fetch(`${BASE_URL}/admin/content`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "Hack", type: "movie" }),
      });
      expect(res.status).toBe(403);
    });
  });
});
