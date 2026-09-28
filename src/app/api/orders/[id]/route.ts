import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { z } from "zod"
import { logAlert, adminActor } from "@/lib/alerts"
import { isSameOrigin } from "@/lib/security"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const order = await prisma.order.findFirst({ where: { OR: [{ id }, { tracking: id.toUpperCase() }] } })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ order: { ...order, items: JSON.parse(order.items as string) } })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

const statusSchema = z.object({
  status: z.enum(["pending", "shipped", "delivered", "cancelled"]).optional(),
  shipper: z.string().max(40).optional(),
  shipmentRef: z.string().max(60).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  if (!token || !(await verifyAdminToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 })

  try {
    const existing = await prisma.order.findFirst({ where: { OR: [{ id }, { tracking: id.toUpperCase() }] } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const prevStatus = existing.status as string
    const nextStatus = (parsed.data.status || prevStatus) as string
    const items = JSON.parse(existing.items as string) as { variantId: string; quantity: number; name: string }[]
    let stockDeducted = (existing as { stockDeducted?: boolean }).stockDeducted ?? false

    // ship: single decrement
    if (nextStatus === "shipped" && !stockDeducted) {
      for (const it of items) {
        const variant = await prisma.productVariant.findUnique({ where: { id: it.variantId } })
        if (!variant) return NextResponse.json({ error: `Variant not found ${it.variantId}` }, { status: 404 })
        if (variant.stock < it.quantity) {
          return NextResponse.json({ error: `INSUFFICIENT_STOCK:${it.name}` }, { status: 400 })
        }
      }
      for (const it of items) {
        await prisma.productVariant.update({
          where: { id: it.variantId },
          data: { stock: { decrement: it.quantity } },
        })
      }
      stockDeducted = true
    }

    // cancel shipped: restore
    if (nextStatus === "cancelled" && stockDeducted) {
      for (const it of items) {
        try {
          await prisma.productVariant.update({
            where: { id: it.variantId },
            data: { stock: { increment: it.quantity } },
          })
        } catch {
          // skip missing variants
        }
      }
      stockDeducted = false
    }

    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: {
        status: nextStatus as never,
        stockDeducted,
        ...(parsed.data.shipper !== undefined ? { shipper: parsed.data.shipper || null } : {}),
        ...(parsed.data.shipmentRef !== undefined ? { shipmentRef: parsed.data.shipmentRef || null } : {}),
      },
    })

    // earn on first delivery
    if (nextStatus === "delivered" && prevStatus !== "delivered") {
      try {
        const { earnForTotal } = await import("@/lib/loyalty")
        const pts = earnForTotal(updated.total)
        const phone = (updated.phone || "").replace(/\s/g, "")
        if (pts > 0 && phone) {
          await prisma.loyaltyAccount.upsert({
            where: { phone },
            update: { points: { increment: pts }, name: updated.customerName },
            create: { phone, name: updated.customerName, points: pts },
          })
        }
      } catch {}
    }
    logAlert("audit", "orders:status", `Order ${existing.tracking} -> ${nextStatus}`, { by: await adminActor() })
    return NextResponse.json({ success: true, order: { ...updated, items: JSON.parse(updated.items as string) } })
  } catch {
    logAlert("error", "orders:status", `Order status change failed: ${id}`, {})
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}