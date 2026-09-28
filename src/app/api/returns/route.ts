import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security"
import { logAlert, adminActor } from "@/lib/alerts"
import { z } from "zod"

async function authed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  return !!token && !!(await verifyAdminToken(token))
}

// GET /api/returns (admin)
export async function GET() {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const list = await prisma.returnRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
    return NextResponse.json({ returns: list })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

const createSchema = z.object({
  tracking: z.string().min(4).max(32),
  name: z.string().max(80).optional().default(""),
  phone: z.string().max(20).optional().default(""),
  reason: z.string().min(2).max(200),
  details: z.string().max(1000).optional().default(""),
})

// POST /api/returns (public)
export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`returns:${ip}`, 5, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    const tracking = parsed.data.tracking.toUpperCase().trim()
    const order = await prisma.order.findUnique({ where: { tracking } })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    const created = await prisma.returnRequest.create({
      data: {
        tracking,
        orderId: order.id,
        name: parsed.data.name || order.customerName,
        phone: parsed.data.phone || order.phone,
        reason: parsed.data.reason,
        details: parsed.data.details || null,
        status: "pending",
      },
    })
    logAlert("info", "returns:create", `Return request ${tracking}: ${parsed.data.reason}`, { ip })
    return NextResponse.json({ success: true, request: created }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

const patchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "completed"]),
})

// PATCH /api/returns (admin)
export async function PATCH(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id") || ""
  const body = await req.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)
  if (!id || !parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    const updated = await prisma.returnRequest.update({ where: { id }, data: { status: parsed.data.status } })
    logAlert("audit", "returns:status", `Return ${updated.tracking} -> ${parsed.data.status}`, { by: await adminActor() })
    return NextResponse.json({ success: true, request: updated })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
