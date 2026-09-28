import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { isSameOrigin } from "@/lib/security"

async function authed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  return !!token && !!(await verifyAdminToken(token))
}

// GET /api/alerts (admin)
export async function GET(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const kind = searchParams.get("kind") || undefined
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50))
  try {
    const [alerts, unread] = await Promise.all([
      prisma.alert.findMany({
        where: kind ? { kind } : {},
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.alert.count({ where: { read: false } }),
    ])
    return NextResponse.json({ alerts, unread })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/alerts mark-read (admin)
export async function PATCH(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  try {
    const body = await req.json().catch(() => ({}))
    if (body.all) {
      await prisma.alert.updateMany({ where: { read: false }, data: { read: true } })
    } else if (Array.isArray(body.ids) && body.ids.length) {
      await prisma.alert.updateMany({ where: { id: { in: body.ids.slice(0, 100) } }, data: { read: true } })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
