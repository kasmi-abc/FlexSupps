import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { verifyAdminToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security"
import { logAlert, adminActor } from "@/lib/alerts"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const goal = searchParams.get("goal")
  const brand = searchParams.get("brand")
  const search = searchParams.get("search")
  const featured = searchParams.get("featured")
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
  const limit = Math.min(24, Math.max(1, parseInt(searchParams.get("limit") || "12", 10) || 12))
  const sort = searchParams.get("sort") || "createdAt"

  const where: Record<string, unknown> = {}

  if (category) (where as Record<string, unknown>)["category"] = { slug: category }
  if (goal) (where as Record<string, unknown>)["goal"] = goal
  if (brand) (where as Record<string, unknown>)["brand"] = { contains: brand, mode: "insensitive" }
  if (featured === "true") (where as Record<string, unknown>)["isFeatured"] = true
  if (search) {
    (where as Record<string, unknown>)["OR"] = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
    ]
  }

  const orderBy: Record<string, string> = {}
  if (sort === "price_asc") orderBy["createdAt"] = "desc" // Price sort: newest first
  else if (sort === "price_desc") orderBy["createdAt"] = "desc"
  else if (sort === "rating") orderBy["rating"] = "desc"
  else orderBy["createdAt"] = "desc"

  try {
    const [total, products] = await Promise.all([
      prisma.product.count({ where: where as never }),
      prisma.product.findMany({
        where: where as never,
        include: { category: true, variants: true, reviews: true },
        orderBy: orderBy as never,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const mapped = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDesc: p.shortDesc,
      goal: p.goal,
      brand: p.brand,
      images: JSON.parse(p.images as string) as string[],
      isFeatured: p.isFeatured,
      isSubscription: p.isSubscription,
      subscriptionDiscount: p.subscriptionDiscount,
      rating: p.rating,
      reviewCount: p.reviewCount,
      category: p.category,
      nutrition: p.nutrition ? JSON.parse(p.nutrition as string) : undefined,
      ingredients: p.ingredients || undefined,
      usage: p.usage || undefined,
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? undefined,
        stock: v.stock,
        image: v.image ?? undefined,
        attributes: JSON.parse(v.attributes as string) as Record<string, string>,
        isDefault: v.isDefault,
      })),
      reviews: p.reviews,
      createdAt: p.createdAt,
    }))

    return NextResponse.json({
      products: mapped,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (e) {
    console.error("GET /api/products error", e)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

const variantSchema = z.object({
  name: z.string().min(1).max(100),
  sku: z.string().min(1).max(32),
  price: z.number().min(100).max(500000),
  compareAtPrice: z.number().min(100).max(500000).optional().nullable(),
  stock: z.number().int().min(0).max(10000),
  image: z.string().optional().nullable(),
  attributes: z.record(z.string()).default({}),
  isDefault: z.boolean().optional().default(false),
})

const productSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).optional(),
  description: z.string().min(10).max(2000),
  shortDesc: z.string().max(200).optional().nullable(),
  goal: z.enum(["MUSCLE_GAIN", "WEIGHT_LOSS", "ENERGY", "RECOVERY", "GENERAL"]).optional().nullable(),
  brand: z.string().min(1).max(80),
  images: z.array(z.string().min(1)).min(1).max(4),
  isFeatured: z.boolean().optional().default(false),
  isSubscription: z.boolean().optional().default(false),
  subscriptionDiscount: z.number().int().min(0).max(50).optional().default(0),
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  variants: z.array(variantSchema).min(1).max(5),
  nutrition: z
    .object({
      servingSize: z.string(),
      servings: z.string(),
      calories: z.number(),
      protein: z.string(),
      carbs: z.string(),
      fat: z.string(),
      sugar: z.string(),
    })
    .optional()
    .nullable(),
  ingredients: z.string().max(1000).optional().nullable(),
  usage: z.string().max(1000).optional().nullable(),
})

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`products:post:${ip}`, 20, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // admin guard
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  try {
    // resolve category
    let categoryId = data.categoryId
    if (!categoryId && data.categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: data.categorySlug } })
      if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 })
      categoryId = cat.id
    }
    if (!categoryId) {
      const cat = await prisma.category.findFirst()
      if (!cat) return NextResponse.json({ error: "No categories exist" }, { status: 400 })
      categoryId = cat.id
    }

    let slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u0600-\u06FF\-]/g, "") || `product-${Date.now()}`
    // unique slug
    let existing = await prisma.product.findUnique({ where: { slug } })
    let c = 1
    const base = slug
    while (existing) {
      slug = `${base}-${c++}`
      existing = await prisma.product.findUnique({ where: { slug } })
    }

    // unique SKUs
    for (const v of data.variants) {
      const skuExists = await prisma.productVariant.findUnique({ where: { sku: v.sku } })
      if (skuExists) {
        return NextResponse.json({ error: `SKU already exists: ${v.sku}` }, { status: 400 })
      }
    }

    const product = await prisma.product.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description,
        shortDesc: data.shortDesc || null,
        goal: data.goal || null,
        brand: data.brand,
        images: JSON.stringify(data.images),
        isFeatured: data.isFeatured ?? false,
        isSubscription: data.isSubscription ?? false,
        subscriptionDiscount: data.subscriptionDiscount ?? 0,
        categoryId,
        nutrition: data.nutrition ? JSON.stringify(data.nutrition) : null,
        ingredients: data.ingredients || null,
        usage: data.usage || null,
        variants: {
          create: data.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            stock: v.stock,
            image: v.image || null,
            attributes: JSON.stringify(v.attributes),
            isDefault: v.isDefault ?? false,
          })),
        },
      },
      include: { variants: true, category: true },
    })

    logAlert("audit", "products:create", `Product created: ${product.name} (${product.slug})`, { by: await adminActor() })
    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (e) {
    console.error("POST /api/products error", e)
    logAlert("error", "products:create", "Create product failed", {})
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}