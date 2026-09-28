"use client"
import Link from "next/link"
import Image from "next/image"
import { Product } from "@/types"
import { ProductDetailClient } from "@/components/ProductDetailClient"
import { AdminProductLoader } from "@/components/AdminProductLoader"
import { useI18n } from "@/i18n/LanguageProvider"

export function ProductPageClient({ product, related, slug }: { product?: Product; related: Product[]; slug: string }) {
  const { t } = useI18n()
  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-zinc-500 flex gap-2">
          <Link href="/" className="hover:underline">{t("breadcrumb.home")}</Link>
          <span>›</span>
          <Link href="/products" className="hover:underline">{t("breadcrumb.store")}</Link>
          <span>›</span>
          <span className="text-black font-medium">{slug}</span>
        </nav>
        <div className="mt-6">
          <AdminProductLoader slug={slug} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-zinc-500 flex gap-2">
        <Link href="/" className="hover:underline">{t("breadcrumb.home")}</Link>
        <span>›</span>
        <Link href="/products" className="hover:underline">{t("breadcrumb.store")}</Link>
        <span>›</span>
        <span className="text-black font-medium">{product.name}</span>
      </nav>

      <div className="mt-6">
        <ProductDetailClient product={product} />
      </div>

      {/* Related products */}
      <div className="mt-12 border-t pt-8">
        <h3 className="font-bold">{t("detail.related")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {related.map(p => (
            <Link key={p.id} href={`/products/${p.slug}`} className="bg-white border rounded-2xl p-3 hover:shadow">
              <Image src={p.images[0]} alt={p.name} width={400} height={400} className="rounded-xl aspect-square object-cover w-full" />
              <p className="font-semibold text-sm mt-2 line-clamp-1">{p.name}</p>
              <p className="text-xs text-zinc-500">{p.brand}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
