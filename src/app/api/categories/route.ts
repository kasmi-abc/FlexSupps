import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })
    const counts = await prisma.product.groupBy({ by: ["categoryId"], _count: { id: true } })
    const countMap = new Map(counts.map((c) => [c.categoryId, c._count.id]))
    const mapped = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      productCount: countMap.get(c.id) || 0,
    }))
    return NextResponse.json({ categories: mapped })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}