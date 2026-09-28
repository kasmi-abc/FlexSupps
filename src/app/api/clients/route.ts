import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"

// GET /api/clients (admin aggregate)
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
    })
    const byPhone = new Map<
      string,
      { phone: string; name: string; wilaya: string; orders: number; spent: number; last: string }
    >()
    for (const o of orders) {
      const phone = (o.phone || "").replace(/\s/g, "") || "unknown"
      const cur = byPhone.get(phone) || {
        phone,
        name: o.customerName,
        wilaya: o.wilaya || "",
        orders: 0,
        spent: 0,
        last: "",
      }
      cur.orders += 1
      cur.spent += o.total
      if (!cur.last) cur.last = new Date(o.createdAt).toISOString().slice(0, 10)
      if (o.customerName && o.customerName !== "[deleted]") cur.name = o.customerName
      if (o.wilaya) cur.wilaya = o.wilaya
      byPhone.set(phone, cur)
    }
    const phones = [...byPhone.keys()]
    const loyalty = await prisma.loyaltyAccount.findMany({ where: { phone: { in: phones } } })
    const points = new Map(loyalty.map((l) => [l.phone, l.points]))
    const clients = [...byPhone.values()]
      .map((c) => ({ ...c, points: points.get(c.phone) || 0 }))
      .sort((a, b) => b.spent - a.spent)
    return NextResponse.json({ clients, total: clients.length })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
