// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Uses a simple sliding window. For multi-instance deployments, swap this
// for rate-limiter-flexible backed by Redis or Upstash.
// For Vercel serverless, this works per-function-instance, which is
// sufficient to deter most abuse on low-to-medium traffic apps.

interface WindowEntry {
  count:     number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

interface RateLimitOptions {
  windowMs:  number; // window duration in ms
  maxHits:   number; // max requests per window
}

export function checkRateLimit(
  key: string,
  { windowMs, maxHits }: RateLimitOptions
): { allowed: boolean; retryAfterMs: number } {
  const now  = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  entry.count++;

  if (entry.count > maxHits) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true, retryAfterMs: 0 };
}

// Prune stale entries every 10 minutes to avoid memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    Array.from(store.entries()).forEach(([key, entry]) => {
      if (now - entry.windowStart > 15 * 60 * 1000) {
        store.delete(key);
      }
    });
  }, 10 * 60 * 1000);
}
