import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security"
import { logAlert, adminActor } from "@/lib/alerts"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const admin = searchParams.get("admin")
  // public: active only
  const where: Record<string, unknown> = {}
  if (admin !== "1") (where as Record<string, unknown>)["active"] = true
  else {
    const cookieStore = await cookies()
    const token = cookieStore.get("z1_admin_token")?.value
    if (!token || !(await verifyAdminToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const promos = await prisma.promo.findMany({ where: where as never, orderBy: { createdAt: "desc" } })
    return NextResponse.json({ promos })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

const promoSchema = z.object({
  code: z.string().min(3).max(12).regex(/^[A-Z0-9]{3,12}$/),
  discount: z.number().int().min(1).max(90),
  expiry: z.string().refine((v) => !isNaN(Date.parse(v)), "invalid date"),
  active: z.boolean().optional().default(true),
  maxUses: z.number().int().min(1).max(100000).optional().nullable(),
})

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`promos:post:${ip}`, 20, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  if (!token || !(await verifyAdminToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = promoSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data

  try {
    const existing = await prisma.promo.findUnique({ where: { code: data.code.toUpperCase() } })
    if (existing) return NextResponse.json({ error: "Code already exists" }, { status: 400 })
    const promo = await prisma.promo.create({
      data: {
        code: data.code.toUpperCase(),
        discount: data.discount,
        expiry: new Date(data.expiry),
        active: data.active ?? true,
        maxUses: data.maxUses ?? null,
      },
    })
    logAlert("audit", "promos:create", `Promo created: ${promo.code} (${promo.discount}%)`, { by: await adminActor() })
    return NextResponse.json({ success: true, promo }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}