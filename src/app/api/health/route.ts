import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/health (public probe)
export async function GET() {
  const started = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    const dbMs = Date.now() - started
    const [products, pendingOrders, unreadAlerts] = await Promise.all([
      prisma.product.count(),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.alert.count({ where: { kind: "error", read: false } }),
    ])
    return NextResponse.json({
      ok: true,
      db: "up",
      dbMs,
      products,
      pendingOrders,
      unreadAlerts,
      time: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { ok: false, db: "down", error: "unreachable", time: new Date().toISOString() },
      { status: 503 }
    )
  }
}
