import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { z } from "zod"
import { logAlert, adminActor } from "@/lib/alerts"
import { isSameOrigin } from "@/lib/security"

export async function DELETE(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  if (!token || !(await verifyAdminToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { code } = await params
  try {
    await prisma.promo.delete({ where: { code: code.toUpperCase() } })
    logAlert("audit", "promos:delete", `Promo deleted: ${code.toUpperCase()}`, { by: await adminActor() })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}

const patchSchema = z.object({
  active: z.boolean().optional(),
  discount: z.number().int().min(1).max(90).optional(),
  expiry: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  if (!token || !(await verifyAdminToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { code } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })

  try {
    const data: Record<string, unknown> = {}
    if (parsed.data.active !== undefined) data["active"] = parsed.data.active
    if (parsed.data.discount !== undefined) data["discount"] = parsed.data.discount
    if (parsed.data.expiry) data["expiry"] = new Date(parsed.data.expiry)
    const promo = await prisma.promo.update({ where: { code: code.toUpperCase() }, data: data as never })
    logAlert("audit", "promos:patch", `Promo updated: ${code.toUpperCase()}`, { by: await adminActor(), patch: parsed.data })
    return NextResponse.json({ success: true, promo })
  } catch {
    return NextResponse.json({ error: "Not found or failed" }, { status: 404 })
  }
}