import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  verifyPassword, hashPassword,
  getAuthCookieName,
} from "@/lib/auth"
import { verifyAdminToken } from "@/lib/auth"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security"
import { logAlert, adminActor } from "@/lib/alerts"
import { cookies } from "next/headers"
import { z } from "zod"

// POST /api/auth/password (admin)
export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`password:${ip}`, 10, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const cookieStore = await cookies()
  const token = cookieStore.get(getAuthCookieName())?.value
  const session = token ? await verifyAdminToken(token) : null
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = z
    .object({ current: z.string().min(1).max(128), next: z.string().min(8).max(128) })
    .safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })

  const admin = await prisma.adminUser.findUnique({ where: { username: session.username } })
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let ok = false
  if (admin.passwordHash === "$2b$10$..." || admin.passwordHash === "$2a$10$...") {
    ok = parsed.data.current === "password123"
  } else {
    ok = await verifyPassword(parsed.data.current, admin.passwordHash)
  }
  if (!ok) {
    logAlert("audit", "admin:password-fail", `Bad current password for ${session.username}`, { ip })
    return NextResponse.json({ error: "Wrong current password" }, { status: 400 })
  }

  await prisma.adminUser.update({
    where: { username: session.username },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  })
  logAlert("audit", "admin:password-change", `Password changed by ${session.username}`, { by: await adminActor() })
  return NextResponse.json({ success: true })
}
