import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const schema = z.object({
  code: z.string().min(2).max(12),
  subtotal: z.number().min(0).optional().default(0),
})

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`promos:validate:${ip}`, 30, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })

  const code = parsed.data.code.toUpperCase().trim()
  try {
    const promo = await prisma.promo.findUnique({ where: { code } })
    if (!promo) return NextResponse.json({ valid: false, error: "Code not found" })
    if (!promo.active) return NextResponse.json({ valid: false, error: "Code inactive" })
    if (promo.expiry < new Date()) return NextResponse.json({ valid: false, error: "Code expired" })
    if (promo.maxUses && promo.uses >= promo.maxUses) return NextResponse.json({ valid: false, error: "Code max uses reached" })

    const discount = Math.round((parsed.data.subtotal || 0) * (promo.discount / 100))
    return NextResponse.json({ valid: true, promo, discount })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}