import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { isSameOrigin } from "@/lib/security"
import { logAlert, adminActor } from "@/lib/alerts"
import { REDEEM_COST, REDEEM_DISCOUNT } from "@/lib/loyalty"
import { z } from "zod"

async function authed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  return !!token && !!(await verifyAdminToken(token))
}

// POST /api/loyalty redeem (admin)
export async function POST(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const parsed = z.object({ action: z.literal("redeem"), phone: z.string().min(9).max(20) }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    const phone = parsed.data.phone.replace(/\s/g, "")
    const acc = await prisma.loyaltyAccount.findUnique({ where: { phone } })
    if (!acc || acc.points < REDEEM_COST) {
      return NextResponse.json({ error: "Not enough points" }, { status: 400 })
    }
    const code = `FID-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const expiry = new Date(Date.now() + 30 * 86400_000)
    await prisma.$transaction([
      prisma.loyaltyAccount.update({ where: { phone }, data: { points: { decrement: REDEEM_COST } } }),
      prisma.promo.create({
        data: { code, discount: REDEEM_DISCOUNT, expiry, active: true, maxUses: 1 },
      }),
    ])
    logAlert("audit", "loyalty:redeem", `${phone} redeemed ${REDEEM_COST} pts -> ${code}`, { by: await adminActor() })
    return NextResponse.json({ success: true, code, discount: REDEEM_DISCOUNT })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
