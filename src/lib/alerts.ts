// Neon event log
import { prisma } from "@/lib/prisma"

export type AlertKind = "error" | "audit" | "info"

// actor tag for audit
export async function adminActor(): Promise<string> {
  try {
    const { cookies } = await import("next/headers")
    const { verifyAdminToken, getAuthCookieName } = await import("@/lib/auth")
    const token = (await cookies()).get(getAuthCookieName())?.value
    if (!token) return "admin"
    const payload = await verifyAdminToken(token)
    return payload?.username || "admin"
  } catch {
    return "admin"
  }
}
export function logAlert(kind: AlertKind, source: string, message: string, meta?: unknown): void {
  prisma.alert
    .create({
      data: {
        kind,
        source,
        message: message.slice(0, 500),
        meta: meta ? JSON.stringify(meta).slice(0, 2000) : null,
      },
    })
    .catch(() => {})
  // prune read alerts >90d
  prisma.alert
    .deleteMany({ where: { read: true, createdAt: { lt: new Date(Date.now() - 90 * 86400_000) } } })
    .catch(() => {})
}
