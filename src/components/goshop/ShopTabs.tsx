"use client"
import { useState } from "react"
import Link from "next/link"
import { Product } from "@/types"
import { ProductCard } from "@/components/ProductCard"
import { useI18n } from "@/i18n/LanguageProvider"

export function GoshopShopTabs({ products }: { products: Product[] }) {
  const { t } = useI18n()
  const tabs = [t("shop.best"), t("shop.trending")]
  const [idx, setIdx] = useState(1)
  const activeTab = tabs[idx] ?? tabs[1]
  const bestSellers = products.filter((p) => p.isFeatured)
  const trending = [...products].reverse()
  const items = (idx === 0 ? bestSellers : trending).slice(0, 4)

  return (
    <section id="shop" className="bg-white py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-center gap-5 sm:justify-start sm:gap-8">
          {tabs.map((tab, i) => {
            const active = i === idx
            return (
              <button
                key={tab}
                onClick={() => setIdx(i)}
                className="group relative shrink-0 whitespace-nowrap pb-2 transition-all duration-300"
              >
                <span
                  className={`text-lg md:text-2xl ${
                    active
                      ? "font-bold tracking-tight text-[#121212]"
                      : "font-medium tracking-tight text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  {tab}
                </span>
                <span
                  className={`absolute -bottom-0.5 start-0 h-[3px] rounded-full bg-[#121212] transition-all duration-300 ${
                    active ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50"
                  }`}
                />
              </button>
            )
          })}
        </div>

        <div
          key={activeTab}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 md:gap-5 lg:grid-cols-4"
          style={{ animation: "fadeSlide 0.35s ease" }}
        >
          {items.length > 0 ? (
            items.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            <p className="text-sm text-zinc-500">{t("shop.empty")}</p>
          )}
        </div>

        <div className="mt-8 text-center max-sm:sticky max-sm:bottom-3 max-sm:z-20">
          <Link
            href="/products"
            className="inline-block w-full rounded-full border border-zinc-300 bg-white px-14 py-3.5 text-[13px] font-extrabold tracking-[0.2em] text-[#121212] transition-all hover:border-[#A6B4C0] hover:bg-[#A6B4C0]/20 active:scale-[0.99] sm:w-auto max-sm:shadow-xl"
          >
            {t("shop.viewAll")}
          </Link>
        </div>
      </div>
    </section>
  )
}
