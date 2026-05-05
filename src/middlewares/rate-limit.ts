type RateLimitEntry = { count: number; resetAt: number };

const store = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(options: { max: number; windowMs: number; message?: string }) {
  const { max, windowMs, message = "Demasiadas tentativas. Tente novamente mais tarde." } = options;

  return ({ request, set }: { request: Request; set: any }) => {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const key = `${ip}:${new URL(request.url).pathname}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      set.status = 429;
      set.headers["Retry-After"] = String(retryAfter);
      set.headers["X-RateLimit-Limit"] = String(max);
      set.headers["X-RateLimit-Remaining"] = "0";
      return {
        error: "Too Many Requests",
        message,
        retryAfterSeconds: retryAfter,
      };
    }

    set.headers["X-RateLimit-Limit"] = String(max);
    set.headers["X-RateLimit-Remaining"] = String(max - entry.count);
  };
}
