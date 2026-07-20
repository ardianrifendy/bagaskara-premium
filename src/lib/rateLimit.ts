// Simple in-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(
  ipOrKey: string,
  maxRequests: number = 15,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ipOrKey);

  if (!record || now > record.expiresAt) {
    rateLimitMap.set(ipOrKey, { count: 1, expiresAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: maxRequests - record.count };
}
