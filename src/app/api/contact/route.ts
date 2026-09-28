import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security"
import { logAlert } from "@/lib/alerts"
import { z } from "zod"

async function authed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  return !!token && !!(await verifyAdminToken(token))
}

const createSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(9).max(20),
  subject: z.string().max(120).optional().default(""),
  message: z.string().min(5).max(2000),
})

// POST /api/contact (public)
export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`contact:${ip}`, 5, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    const msg = await prisma.contactMessage.create({ data: parsed.data })
    logAlert("info", "contact:new", `Message from ${parsed.data.name} (${parsed.data.phone})`, { ip })
    return NextResponse.json({ success: true, id: msg.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// GET /api/contact inbox (admin)
export async function GET() {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
    const unread = await prisma.contactMessage.count({ where: { read: false } })
    return NextResponse.json({ messages, unread })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/contact mark-read (admin)
// DELETE /api/contact (admin)
export async function PATCH(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  try {
    const body = await req.json().catch(() => ({}))
    if (body.all) {
      await prisma.contactMessage.updateMany({ where: { read: false }, data: { read: true } })
    } else if (Array.isArray(body.ids) && body.ids.length) {
      await prisma.contactMessage.updateMany({ where: { id: { in: body.ids.slice(0, 100) } }, data: { read: true } })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id") || ""
  if (!id) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    await prisma.contactMessage.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
