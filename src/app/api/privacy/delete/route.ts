import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security"
import { logAlert } from "@/lib/alerts"
import { z } from "zod"

// POST /api/privacy/delete (tracking-proof erase)
export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`privacy:${ip}`, 5, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const parsed = z.object({ tracking: z.string().min(4).max(32) }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })

  try {
    const order = await prisma.order.findUnique({
      where: { tracking: parsed.data.tracking.toUpperCase().trim() },
    })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
    await prisma.order.update({
      where: { id: order.id },
      data: {
        customerName: "[deleted]",
        phone: "[deleted]",
        wilaya: null,
        address: null,
        email: null,
      },
    })
    logAlert("audit", "privacy:erase", `Personal data erased for ${order.tracking}`, { ip })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
