import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"

// GET /api/stats (admin)
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ["shipped", "delivered"] } },
      take: 5000,
    })
    const revenue = orders.reduce((s, o) => s + o.total, 0)
    const byStatus: Record<string, number> = { pending: 0, shipped: 0, delivered: 0, cancelled: 0 }
    const all = await prisma.order.findMany({ select: { status: true }, take: 5000 })
    for (const o of all) {
      const k = o.status as keyof typeof byStatus
      if (k in byStatus) byStatus[k] += 1
    }

    // per-product aggregates
    const agg = new Map<string, { name: string; qty: number; revenue: number }>()
    for (const o of orders) {
      try {
        const items = JSON.parse(o.items as string) as { name: string; price: number; quantity: number; variantId?: string }[]
        for (const it of items) {
          const cur = agg.get(it.name) || { name: it.name, qty: 0, revenue: 0 }
          cur.qty += it.quantity
          cur.revenue += it.price * it.quantity
          agg.set(it.name, cur)
        }
      } catch {}
    }

    // variant cost map
    const variants = await prisma.productVariant.findMany({ select: { id: true, costPrice: true, price: true } })
    const cost = new Map(variants.map((v) => [v.id, v.costPrice || 0]))
    let profit = 0
    let costedRevenue = 0
    for (const o of orders) {
      try {
        const items = JSON.parse(o.items as string) as { price: number; quantity: number; variantId?: string }[]
        for (const it of items) {
          const c = Number((it.variantId && cost.get(it.variantId)) || 0)
          profit += (it.price - c) * it.quantity
          costedRevenue += it.price * it.quantity
        }
      } catch {}
    }

    const top = [...agg.values()].sort((a, b) => b.qty - a.qty).slice(0, 10)
    return NextResponse.json({
      revenue,
      orders: byStatus,
      deliveredCount: orders.length,
      top,
      profit,
      marginPct: costedRevenue > 0 ? Math.round((profit / costedRevenue) * 100) : 0,
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
