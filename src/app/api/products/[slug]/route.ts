import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { z } from "zod"
import { logAlert, adminActor } from "@/lib/alerts"
import { isSameOrigin } from "@/lib/security"

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true, variants: true, reviews: true },
    })
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const mapped = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDesc: product.shortDesc,
      goal: product.goal,
      brand: product.brand,
      images: JSON.parse(product.images as string),
      isFeatured: product.isFeatured,
      isSubscription: product.isSubscription,
      subscriptionDiscount: product.subscriptionDiscount,
      rating: product.rating,
      reviewCount: product.reviewCount,
      category: product.category,
      nutrition: product.nutrition ? JSON.parse(product.nutrition as string) : undefined,
      ingredients: product.ingredients || undefined,
      usage: product.usage || undefined,
      variants: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? undefined,
        stock: v.stock,
        image: v.image ?? undefined,
        attributes: JSON.parse(v.attributes as string),
        isDefault: v.isDefault,
      })),
      reviews: product.reviews,
    }
    return NextResponse.json({ product: mapped })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  if (!token || !(await verifyAdminToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { slug } = await params
  try {
    const prod = await prisma.product.findUnique({ where: { slug } })
    if (!prod) return NextResponse.json({ error: "Not found" }, { status: 404 })
    await prisma.product.delete({ where: { id: prod.id } })
    logAlert("audit", "products:delete", `Product deleted: ${prod.name} (${slug})`, { by: await adminActor() })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}

const patchSchema = z.object({
  price: z.number().min(100).max(500000).optional(),
  stock: z.number().int().min(0).max(10000).optional(),
  isFeatured: z.boolean().optional(),
  costPrice: z.number().min(0).max(500000).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  if (!token || !(await verifyAdminToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { slug } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })

  try {
    const product = await prisma.product.findUnique({ where: { slug }, include: { variants: true } })
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updates: Record<string, unknown> = {}
    if (parsed.data.isFeatured !== undefined) updates["isFeatured"] = parsed.data.isFeatured

    if (Object.keys(updates).length) {
      await prisma.product.update({ where: { id: product.id }, data: updates as never })
    }
    if (parsed.data.stock !== undefined || parsed.data.price !== undefined || parsed.data.costPrice !== undefined) {
      const firstVariant = product.variants.find((v) => v.isDefault) || product.variants[0]
      if (firstVariant) {
        await prisma.productVariant.update({
          where: { id: firstVariant.id },
          data: {
            ...(parsed.data.price !== undefined ? { price: parsed.data.price } : {}),
            ...(parsed.data.stock !== undefined ? { stock: parsed.data.stock } : {}),
            ...(parsed.data.costPrice !== undefined ? { costPrice: parsed.data.costPrice } : {}),
          },
        })
      }
    }
    logAlert("audit", "products:patch", `Product updated: ${slug}`, { by: await adminActor(), patch: parsed.data })
    return NextResponse.json({ success: true })
  } catch {
    logAlert("error", "products:patch", `Product patch failed: ${slug}`, {})
    return NextResponse.json({ error: "Patch failed" }, { status: 500 })
  }
}