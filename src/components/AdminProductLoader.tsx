"use client"
import { useEffect, useState } from "react"
import { ProductDetailClient } from "@/components/ProductDetailClient"
import type { Product } from "@/types"
import { useI18n } from "@/i18n/LanguageProvider"

function normalize(api: Record<string, unknown>): Product {
  const raw = api as {
    images?: unknown
    variants?: unknown
    nutrition?: unknown
    category?: Product["category"]
    reviews?: Product["reviews"]
  }
  const variants = Array.isArray(raw.variants) ? raw.variants : []
  return {
    ...(api as unknown as Product),
    images: typeof raw.images === "string" ? (JSON.parse(raw.images) as string[]) : (raw.images as string[]),
    variants: variants.map((v) => {
      const vv = v as Record<string, unknown>
      return {
        ...(vv as unknown as Product["variants"][number]),
        attributes:
          typeof vv.attributes === "string"
            ? (JSON.parse(vv.attributes) as Record<string, string>)
            : ((vv.attributes || {}) as Record<string, string>),
      }
    }),
    nutrition:
      typeof raw.nutrition === "string"
        ? (JSON.parse(raw.nutrition) as Product["nutrition"])
        : ((raw.nutrition || undefined) as Product["nutrition"]),
    category: raw.category || { id: "", name: "", slug: "" },
    reviews: raw.reviews || [],
  }
}

export function AdminProductLoader({ slug }: { slug: string }) {
  const { t } = useI18n()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      // LS cache first
      try {
        const saved = localStorage.getItem("z1-admin-products")
        if (saved) {
          const list: Product[] = JSON.parse(saved)
          const found = list.find(p => p.slug === slug)
          if (found && !cancelled) { setProduct(found); setLoading(false); return }
        }
      } catch {}
      // Neon fallback
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (data.product && !cancelled) { setProduct(normalize(data.product)); setLoading(false); return }
        }
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  if (loading) return <div className="text-center py-16 text-sm">...</div>
  if (!product) return <div className="text-center py-16"><p className="font-black">{t("detail.notFound")}</p></div>

  return <ProductDetailClient product={product} />
}
