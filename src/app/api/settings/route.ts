import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { isSameOrigin } from "@/lib/security"
import { logAlert, adminActor } from "@/lib/alerts"
import { z } from "zod"

async function authed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  return !!token && !!(await verifyAdminToken(token))
}

// public settings whitelist
const PUBLIC_KEYS = ["shipping_threshold", "shipping_fee", "cod_enabled", "loyalty_enabled"]

const DEFAULTS: Record<string, string> = {
  shipping_threshold: "10000",
  shipping_fee: "500",
  cod_enabled: "1",
  loyalty_enabled: "1",
}

// GET /api/settings (public)
export async function GET() {
  try {
    const rows = await prisma.setting.findMany({ where: { key: { in: PUBLIC_KEYS } } })
    const out: Record<string, string> = { ...DEFAULTS }
    for (const r of rows) out[r.key] = r.value
    return NextResponse.json({ settings: out })
  } catch {
    return NextResponse.json({ settings: DEFAULTS })
  }
}

// PUT /api/settings (admin)
export async function PUT(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const parsed = z.object({ key: z.string().min(1).max(60), value: z.string().max(500) }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    await prisma.setting.upsert({
      where: { key: parsed.data.key },
      update: { value: parsed.data.value },
      create: { key: parsed.data.key, value: parsed.data.value },
    })
    logAlert("audit", "settings:update", `${parsed.data.key} = ${parsed.data.value}`, { by: await adminActor() })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
