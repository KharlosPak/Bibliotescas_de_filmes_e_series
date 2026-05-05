if (!process.env.DATABASE_URL) {
  throw new Error(" DATABASE_URL não encontrada no ficheiro .env");
}

if (!process.env.JWT_SECRET) {
  throw new Error(" JWT_SECRET não encontrada no ficheiro .env");
}

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;
