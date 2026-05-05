const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Variável de ambiente obrigatória não encontrada: ${key}`);
  return value;
};

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN_SECONDS: 7 * 24 * 60 * 60,       // 7 dias
  REFRESH_TOKEN_EXPIRES_IN_SECONDS: 30 * 24 * 60 * 60, // 30 dias
} as const;
