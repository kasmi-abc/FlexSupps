"use client"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Product } from "@/types"
import { IconStar, IconCart, IconHeart } from "@/components/Icons"
import { addToCartDirect } from "@/store/cart"
import { useWishlist } from "@/store/wishlist"
import { useI18n } from "@/i18n/LanguageProvider"

export function ProductCard({ product }: { product: Product }) {
  const { t, fp, catName } = useI18n()
  const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0]
  const outOfStock = product.variants.every(v => v.stock === 0)
  const [added, setAdded] = useState(false)
  const { toggle, has } = useWishlist()
  const wished = has(product.id)

  const save = defaultVariant.compareAtPrice
    ? defaultVariant.compareAtPrice - defaultVariant.price
    : 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock || defaultVariant.stock === 0) return
    addToCartDirect({
      productId: product.id,
      variantId: defaultVariant.id,
      name: product.name,
      variantName: defaultVariant.name,
      image: product.images[0],
      price: defaultVariant.price,
      quantity: 1,
      isSubscription: false,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-all duration-300 hover:shadow-lg max-sm:w-[80%] max-sm:shrink-0 max-sm:snap-center">
      {/* image */}
      <div className="relative bg-white p-4">
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={wished ? t("card.removeWish") : t("card.addWish")}
          aria-pressed={wished}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-100 bg-white shadow-sm transition-all hover:scale-105 active:scale-95"
        >
          <span className={wished ? "text-red-600" : "text-zinc-400"}>
            <IconHeart className="h-4 w-4" filled={wished} aria-hidden="true" />
          </span>
        </button>

        {product.isFeatured && (
          <span className="absolute left-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#121212] p-1 text-center text-[8px] font-extrabold uppercase leading-tight tracking-wide text-white">
            {t("card.bestseller")}
          </span>
        )}

        <Link href={`/products/${product.slug}`} className="relative mx-auto block aspect-square w-full max-w-52 overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 300px"
            className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-0"
          />
          <Image
            src={product.images[1] || product.images[0]}
            alt=""
            aria-hidden="true"
            loading="lazy"
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 300px"
            className="scale-105 object-cover opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
          />
        </Link>

        {/* variants */}
        <div className="mt-2 flex h-6 flex-wrap items-center justify-center gap-1.5 overflow-hidden">
          {product.variants.slice(0, 5).map((v) => (
            <span
              key={v.id}
              className="rounded-sm border border-zinc-200 px-1.5 py-0.5 text-[10px] font-bold text-[#666666]"
            >
              {Object.values(v.attributes)[0] || v.name}
            </span>
          ))}
        </div>
      </div>

      {/* meta */}
      <div className="flex flex-1 flex-col px-4 pb-0">
        <p className="text-[11px] font-bold tracking-wide text-zinc-400">{catName(product.category.slug, product.category.name)}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-10 text-[13.5px] font-medium leading-snug text-[#121212] hover:text-[#E51D25]">
            {product.name}
          </h3>
        </Link>

        {/* rating */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="flex items-center gap-0.5 text-[#121212]">
            {[0, 1, 2, 3, 4].map((i) => (
              <IconStar key={i} className="h-3.5 w-3.5" filled={i < Math.round(product.rating)} />
            ))}
          </span>
          <span className="text-xs font-semibold text-[#121212]">{product.rating}</span>
          <span className="text-xs text-[#777777]">({product.reviewCount})</span>
        </div>

        {/* price */}
        <div className="mt-2 text-center">
          <p className="text-[22px] font-extrabold tracking-tight text-[#121212]">
            {fp(defaultVariant.price)}
          </p>
          {defaultVariant.compareAtPrice && (
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="rounded-[4px] border border-red-400 px-1.5 py-0.5 text-[11px] font-bold text-red-500 line-through">
                {t("card.before")} {fp(defaultVariant.compareAtPrice)}
              </span>
              <span className="rounded-[4px] border border-[#137333] bg-[#E6F4EA] px-1.5 py-0.5 text-[11px] font-bold text-[#137333]">
                {t("card.save")} {fp(save)}
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3">
          <button
            onClick={handleAdd}
            disabled={outOfStock || defaultVariant.stock === 0}
            className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-[13px] font-extrabold tracking-widest text-white transition-all active:scale-[0.98] ${
              outOfStock || defaultVariant.stock === 0
                ? "cursor-not-allowed bg-zinc-300"
                : added
                ? "bg-[#137333]"
                : "bg-[#121212] hover:opacity-90"
            }`}
          >
            <IconCart className="h-[18px] w-[18px]" />
            {outOfStock ? t("card.out") : added ? t("card.added") : t("card.quickBuy")}
          </button>
        </div>
      </div>

      {/* strip */}
      <p className="mt-3 border-t border-zinc-100 bg-[#F8F9FA] px-2 py-2 text-center text-[9.5px] font-bold leading-tight tracking-wide text-[#121212]">
        {t("card.strip")}
      </p>
    </div>
  )
}
