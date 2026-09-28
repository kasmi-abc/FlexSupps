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

// GET /api/reviews (admin)
export async function GET() {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { product: { select: { name: true, slug: true } } },
    })
    return NextResponse.json({ reviews })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// PATCH /api/reviews approve (admin)
// DELETE /api/reviews (admin)
export async function PATCH(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id") || ""
  const body = await req.json().catch(() => ({}))
  const parsed = z.object({ approved: z.boolean() }).safeParse(body)
  if (!id || !parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    await prisma.review.update({ where: { id }, data: { approved: parsed.data.approved } })
    logAlert("audit", "reviews:moderate", `Review ${id} -> ${parsed.data.approved ? "approved" : "hidden"}`, { by: await adminActor() })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id") || ""
  if (!id) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    await prisma.review.delete({ where: { id } })
    logAlert("audit", "reviews:delete", `Review deleted`, { by: await adminActor() })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
