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

// GET /api/stock/batches (admin)
export async function GET() {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const batches = await prisma.batch.findMany({
      orderBy: { expiry: "asc" },
      take: 200,
      include: { variant: { include: { product: { select: { name: true } } } } },
    })
    return NextResponse.json({ batches })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

const createSchema = z.object({
  variantId: z.string().min(1),
  lot: z.string().min(1).max(40),
  expiry: z.string().refine((v) => !isNaN(Date.parse(v)), "invalid date"),
  qty: z.number().int().min(0).max(100000),
  note: z.string().max(200).optional().default(""),
})

// POST batch (adds stock)
export async function POST(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    const variant = await prisma.productVariant.findUnique({ where: { id: parsed.data.variantId } })
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    const batch = await prisma.batch.create({
      data: {
        variantId: variant.id,
        lot: parsed.data.lot,
        expiry: new Date(parsed.data.expiry),
        qty: parsed.data.qty,
        note: parsed.data.note || null,
      },
    })
    if (parsed.data.qty > 0) {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { stock: { increment: parsed.data.qty } },
      })
    }
    logAlert("audit", "stock:batch", `Batch ${parsed.data.lot} +${parsed.data.qty} (${variant.sku})`, { by: await adminActor() })
    return NextResponse.json({ success: true, batch }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// DELETE batch record (admin)
export async function DELETE(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id") || ""
  if (!id) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    await prisma.batch.delete({ where: { id } })
    logAlert("audit", "stock:batch-delete", `Batch record deleted`, { by: await adminActor() })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
