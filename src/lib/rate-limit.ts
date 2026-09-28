// shared Neon buckets, memory fallback
import { prisma } from "@/lib/prisma"

const mem = new Map<string, { count: number; reset: number }>()

export async function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): Promise<{ ok: boolean; remaining: number; reset: number }> {
  const now = Date.now()
  try {
    const rec = await prisma.rateLimit.findUnique({ where: { key } })
    if (!rec || rec.resetAt.getTime() <= now) {
      const resetAt = new Date(now + windowMs)
      await prisma.rateLimit.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      })
      return { ok: true, remaining: limit - 1, reset: now + windowMs }
    }
    if (rec.count >= limit) {
      return { ok: false, remaining: 0, reset: rec.resetAt.getTime() }
    }
    await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } })
    return { ok: true, remaining: limit - rec.count - 1, reset: rec.resetAt.getTime() }
  } catch {
    // memory path
    const entry = mem.get(key)
    if (!entry || now > entry.reset) {
      mem.set(key, { count: 1, reset: now + windowMs })
      return { ok: true, remaining: limit - 1, reset: now + windowMs }
    }
    if (entry.count >= limit) return { ok: false, remaining: 0, reset: entry.reset }
    entry.count++
    return { ok: true, remaining: limit - entry.count, reset: entry.reset }
  }
}

export function getClientIp(req: Request): string {
  const fwd = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim()
  return fwd || req.headers.get("x-real-ip") || "unknown"
}

// prune expired
export function pruneRateLimits(): void {
  prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } }).catch(() => {})
}
