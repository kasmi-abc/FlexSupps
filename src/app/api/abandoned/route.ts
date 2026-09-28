import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security"
import { z } from "zod"

async function authed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  return !!token && !!(await verifyAdminToken(token))
}

const itemSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  image: z.string().max(500).optional().default(""),
})

const createSchema = z.object({
  sessionId: z.string().min(4).max(64),
  phone: z.string().max(20).optional().default(""),
  items: z.array(itemSchema).min(1).max(20),
  total: z.number().min(0),
})

// POST /api/abandoned (public beacon)
export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`abandoned:${ip}`, 10, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    const existing = await prisma.abandonedCart.findFirst({
      where: { sessionId: parsed.data.sessionId, ordered: false },
      orderBy: { updatedAt: "desc" },
    })
    const payload = {
      phone: parsed.data.phone || existing?.phone || null,
      items: JSON.stringify(parsed.data.items),
      total: parsed.data.total,
    }
    if (existing) {
      await prisma.abandonedCart.update({ where: { id: existing.id }, data: payload })
    } else {
      await prisma.abandonedCart.create({
        data: { sessionId: parsed.data.sessionId, ...payload },
      })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

const patchSchema = z.object({
  id: z.string().optional(),
  sessionId: z.string().optional(),
  reminded: z.boolean().optional(),
  ordered: z.boolean().optional(),
})

// PATCH flags (admin id / public sessionId)
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id, sessionId, reminded, ordered } = parsed.data
  try {
    if (id) {
      if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      await prisma.abandonedCart.update({
        where: { id },
        data: { ...(reminded !== undefined ? { reminded } : {}), ...(ordered !== undefined ? { ordered } : {}) },
      })
      return NextResponse.json({ success: true })
    }
    if (sessionId && ordered) {
      await prisma.abandonedCart.updateMany({ where: { sessionId, ordered: false }, data: { ordered: true } })
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: "Invalid" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// GET /api/abandoned (admin)
export async function GET() {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const list = await prisma.abandonedCart.findMany({ orderBy: { updatedAt: "desc" }, take: 100 })
    return NextResponse.json({
      carts: list.map((c) => ({ ...c, items: JSON.parse(c.items as string) })),
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
