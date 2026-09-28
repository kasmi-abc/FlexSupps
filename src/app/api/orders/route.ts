import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security"
import { logAlert } from "@/lib/alerts"

const orderItemSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  name: z.string().min(1),
  variantName: z.string().optional().default(""),
  image: z.string().optional().default(""),
  price: z.number().min(0),
  quantity: z.number().int().min(1).max(20),
  isSubscription: z.boolean().optional().default(false),
})

const orderSchema = z.object({
  customerName: z.string().min(2).max(80),
  phone: z.string().regex(/^0(5|6|7)[0-9]{8}$/, "phone invalid"),
  wilaya: z.string().min(1).max(80),
  address: z.string().min(5).max(200),
  email: z.string().email().optional().nullable(),
  items: z.array(orderItemSchema).min(1).max(20),
  promoCode: z.string().max(12).optional().nullable(),
})

function generateTracking(): string {
  return `TRK-${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`orders:post:${ip}`, 10, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  try {
    // DB prices, stock check
    let subtotal = 0
    for (const it of data.items) {
      const variant = await prisma.productVariant.findUnique({ where: { id: it.variantId } })
      if (!variant) return NextResponse.json({ error: `Variant not found ${it.variantId}` }, { status: 404 })
      if (variant.stock < it.quantity) return NextResponse.json({ error: `Insufficient stock for ${it.name}` }, { status: 400 })
      subtotal += variant.price * it.quantity
    }

    let discount = 0
    let promoCode: string | null = null
    if (data.promoCode) {
      const code = data.promoCode.toUpperCase().trim()
      const promo = await prisma.promo.findUnique({ where: { code } })
      if (promo && promo.active && promo.expiry > new Date() && (!promo.maxUses || promo.uses < promo.maxUses)) {
        discount = Math.round(subtotal * (promo.discount / 100))
        promoCode = promo.code
        await prisma.promo.update({ where: { id: promo.id }, data: { uses: { increment: 1 } } })
      }
    }

    const shipping = subtotal >= 10000 ? 0 : 500
    const total = subtotal - discount + shipping
    const tracking = generateTracking()
    const id = `GB-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`

    const order = await prisma.order.create({
      data: {
        id,
        tracking,
        customerName: data.customerName.trim(),
        phone: data.phone.replace(/\s/g, ""),
        wilaya: data.wilaya,
        address: data.address,
        email: data.email || null,
        items: JSON.stringify(data.items),
        subtotal,
        discount,
        promoCode,
        shipping,
        total,
        status: "pending",
      },
    })

    // stock moves on ship/cancel

    logAlert("info", "orders:create", `Order ${tracking} created (${total} DA)`, {})
    return NextResponse.json({ success: true, order: { ...order, items: JSON.parse(order.items as string) } }, { status: 201 })
  } catch {
    console.error("POST /api/orders failed")
    logAlert("error", "orders:create", "Order creation failed", {})
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tracking = searchParams.get("tracking")
  const admin = searchParams.get("admin")

  // tracking lookup
  if (tracking) {
    try {
      const order = await prisma.order.findUnique({ where: { tracking: tracking.toUpperCase().trim() } })
      if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json({ order: { ...order, items: JSON.parse(order.items as string) } })
    } catch {
      return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
  }

  // admin list
  if (admin === "1") {
    const cookieStore = await cookies()
    const token = cookieStore.get("z1_admin_token")?.value
    if (!token || !(await verifyAdminToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20))
    const status = searchParams.get("status")
    const where: Record<string, unknown> = {}
    if (status) (where as Record<string, unknown>)["status"] = status
    try {
      const [total, orders] = await Promise.all([
        prisma.order.count({ where: where as never }),
        prisma.order.findMany({ where: where as never, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      ])
      const mapped = orders.map((o) => ({ ...o, items: JSON.parse(o.items as string) }))
      return NextResponse.json({ orders: mapped, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
    } catch {
      return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Missing tracking or admin param" }, { status: 400 })
}