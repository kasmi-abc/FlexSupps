import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"

// GET /api/stock/alerts (admin)
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const now = new Date()
    const soon = new Date(now.getTime() + 90 * 86400_000)
    const [expiring, lowStock] = await Promise.all([
      prisma.batch.findMany({
        where: { expiry: { lte: soon } },
        orderBy: { expiry: "asc" },
        take: 50,
        include: { variant: { include: { product: { select: { name: true } } } } },
      }),
      prisma.productVariant.findMany({
        where: { stock: { lt: 5 } },
        take: 50,
        include: { product: { select: { name: true } } },
      }),
    ])
    return NextResponse.json({
      expiring: expiring.map((b) => ({
        id: b.id,
        lot: b.lot,
        expiry: b.expiry,
        qty: b.qty,
        daysLeft: Math.ceil((b.expiry.getTime() - now.getTime()) / 86400_000),
        variant: b.variant.name,
        sku: b.variant.sku,
        product: b.variant.product.name,
      })),
      lowStock: lowStock.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        stock: v.stock,
        product: v.product.name,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
