import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security"
import { logAlert, adminActor } from "@/lib/alerts"
import { z } from "zod"

async function authed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  return !!token && !!(await verifyAdminToken(token))
}

// GET /api/posts (public published)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get("admin") === "1") {
    if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    try {
      const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
      return NextResponse.json({ posts })
    } catch {
      return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
  }
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json({ posts })
  } catch {
    return NextResponse.json({ posts: [] })
  }
}

const postSchema = z.object({
  slug: z.string().min(2).max(80),
  titleFr: z.string().min(2).max(160),
  titleAr: z.string().min(2).max(160),
  excerptFr: z.string().max(500).optional().default(""),
  excerptAr: z.string().max(500).optional().default(""),
  contentFr: z.string().min(10).max(20000),
  contentAr: z.string().min(10).max(20000),
  category: z.string().max(40).optional().default(""),
  image: z.string().max(500).optional().default(""),
  published: z.boolean().optional().default(true),
})

// POST /api/posts (admin)
export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`posts:${ip}`, 20, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    const post = await prisma.post.create({ data: parsed.data })
    logAlert("audit", "posts:create", `Post created: ${post.slug}`, { by: await adminActor() })
    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Slug exists or failed" }, { status: 400 })
  }
}

// PATCH /api/posts (admin)
export async function PATCH(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug") || ""
  const body = await req.json().catch(() => ({}))
  const parsed = postSchema.partial().safeParse(body)
  if (!slug || !parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    const post = await prisma.post.update({ where: { slug }, data: parsed.data })
    logAlert("audit", "posts:update", `Post updated: ${slug}`, { by: await adminActor() })
    return NextResponse.json({ success: true, post })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

// DELETE /api/posts (admin)
export async function DELETE(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug") || ""
  if (!slug) return NextResponse.json({ error: "Invalid" }, { status: 400 })
  try {
    await prisma.post.delete({ where: { slug } })
    logAlert("audit", "posts:delete", `Post deleted: ${slug}`, { by: await adminActor() })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
