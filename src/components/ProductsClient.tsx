"use client"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { categories } from "@/data/products"
import { useProducts } from "@/hooks/useProducts"
import { ProductCard } from "@/components/ProductCard"
import { IconSearch, IconStar } from "@/components/Icons"
import { useI18n } from "@/i18n/LanguageProvider"

function buildUrl(params: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const next: Record<string, string | undefined> = { ...params, ...overrides }
  const clean: Record<string, string> = {}
  for (const k of Object.keys(next)) {
    const v = next[k]
    if (v && v !== "all") clean[k] = v
  }
  const qs = new URLSearchParams(clean).toString()
  return qs ? `/products?${qs}` : "/products"
}

export function ProductsClient() {
  const searchParams = useSearchParams()
  const { t, catName } = useI18n()
  const allProducts = useProducts()

  const goal = searchParams.get("goal") || undefined
  const category = searchParams.get("category") || undefined
  const brand = searchParams.get("brand") || undefined
  const flavor = searchParams.get("flavor") || undefined
  const q = searchParams.get("q") || undefined
  const maxPrice = searchParams.get("maxPrice") || undefined
  const sort = searchParams.get("sort") || undefined
  const page = Math.max(1, Number(searchParams.get("page") || 1))

  const currentParams: Record<string, string | undefined> = { goal, category, brand, flavor, q, maxPrice, sort, page: page !== 1 ? String(page) : undefined }

  const allBrands = Array.from(new Set(allProducts.map(p => p.brand)))
  const allFlavors = Array.from(new Set(allProducts.flatMap(p => p.variants.map(v => v.attributes.flavor).filter(Boolean) as string[])))

  let filtered = [...allProducts]

  if (q) {
    const term = q.toLowerCase()
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    )
  }

  if (goal && goal !== "all") filtered = filtered.filter(p => p.goal === goal)
  if (category && category !== "all") filtered = filtered.filter(p => p.category.slug === category)
  if (brand && brand !== "all") filtered = filtered.filter(p => p.brand === brand)
  if (flavor && flavor !== "all") filtered = filtered.filter(p => p.variants.some(v => v.attributes.flavor === flavor))
  if (maxPrice) {
    const max = Number(maxPrice)
    filtered = filtered.filter(p => {
      const price = (p.variants.find(v => v.isDefault) || p.variants[0]).price
      return price <= max
    })
  }

  if (sort === "price-asc") filtered.sort((a, b) => (a.variants[0].price - b.variants[0].price))
  if (sort === "price-desc") filtered.sort((a, b) => (b.variants[0].price - a.variants[0].price))
  if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating)

  const activeCount = [goal, category, brand, flavor, q, maxPrice].filter(Boolean).length
  const catLabel = (slug: string, fallback: string) => catName(slug, fallback)

  return (
    <div>
      {category === "vitamins" && (
        <div className="relative overflow-hidden rounded-3xl mb-8">
          <Image src="/images/banners/vitamins-hero.avif" alt="vitamins" width={1200} height={224} className="w-full h-44 sm:h-56 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121212]/70 via-transparent to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
            <p className="text-white text-xl sm:text-2xl font-black">{catLabel("vitamins", "vitamins")}</p>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">{t("catalog.title")}</h1>
          <p className="text-sm text-zinc-600 mt-1">{t("catalog.sub")}</p>
        </div>

        <form action="/products" method="GET" className="flex gap-2 bg-white border border-[#A6B4C0]/30 rounded-full p-1">
          {goal && <input type="hidden" name="goal" value={goal} />}
          {category && <input type="hidden" name="category" value={category} />}
          {brand && <input type="hidden" name="brand" value={brand} />}
          {flavor && <input type="hidden" name="flavor" value={flavor} />}
          {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <input
            name="q"
            defaultValue={q}
            placeholder={t("catalog.searchPh")}
            className="bg-transparent px-4 py-2 text-sm w-56 focus:outline-none"
          />
          <button type="submit" className="bg-[#E51D25] text-white px-6 py-2 rounded-full text-sm font-black flex items-center gap-1">
            <IconSearch className="h-4 w-4" /> {t("actions.search")}
          </button>
        </form>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-8 mt-8">
        <aside className="space-y-4">
          <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black flex items-center gap-2">{t("catalog.filters")} <span className="bg-[#FFFFFF] border border-[#A6B4C0]/30 px-2 py-0.5 rounded-full text-xs">{activeCount}</span></h3>
              {activeCount > 0 && <Link href="/products" className="text-xs font-bold text-[#E51D25] underline">{t("catalog.clearAll")}</Link>}
            </div>

            <div className="mt-5">
              <p className="text-sm font-black mb-2 flex items-center gap-2"><span className="h-1 w-6 bg-[#E51D25] rounded-full" /> {t("catalog.byGoal")}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: t("catalog.gAll"), value: "all" },
                  { label: t("catalog.gMass"), value: "MUSCLE_GAIN" },
                  { label: t("catalog.gCut"), value: "WEIGHT_LOSS" },
                  { label: t("catalog.gEnergy"), value: "ENERGY" },
                  { label: t("catalog.gHealth"), value: "GENERAL" },
                ].map(f => {
                  const active = (goal || "all") === f.value
                  return (
                    <Link
                      key={f.value}
                      href={buildUrl(currentParams, { goal: f.value })}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border ${active ? "bg-[#121212] text-white border-[#121212]" : "bg-white border-[#A6B4C0]/30 hover:border-[#E51D25]"}`}
                    >
                      {f.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-black mb-2">{t("catalog.byType")}</p>
              <div className="space-y-1">
                <Link href={buildUrl(currentParams, { category: "all" })} className={`block px-3 py-2 rounded-xl text-sm font-bold flex justify-between ${!category || category === "all" ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF] border border-transparent hover:border-[#A6B4C0]/20"}`}>{t("actions.all")} <span>{allProducts.length}</span></Link>
                {categories.map(c => {
                  const active = category === c.slug
                  const count = allProducts.filter(p => p.category.slug === c.slug).length
                  return (
                    <Link
                      key={c.id}
                      href={buildUrl(currentParams, { category: c.slug })}
                      className={`block px-3 py-2 rounded-xl text-sm font-bold flex justify-between ${active ? "bg-[#E51D25] text-white" : "hover:bg-[#FFFFFF]"}`}
                    >
                      <span>{catLabel(c.slug, c.name)}</span><span className="text-xs opacity-60">{count}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-black mb-2">{t("catalog.byBrand")}</p>
              <div className="space-y-1 max-h-32 overflow-auto">
                <Link href={buildUrl(currentParams, { brand: "all" })} className={`block px-3 py-1.5 rounded-xl text-xs font-bold ${!brand || brand === "all" ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("actions.all")}</Link>
                {allBrands.map(b => (
                  <Link
                    key={b}
                    href={buildUrl(currentParams, { brand: b })}
                    className={`block px-3 py-1.5 rounded-xl text-xs font-bold ${brand === b ? "bg-[#E51D25] text-white" : "hover:bg-[#FFFFFF]"}`}
                  >
                    {b}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-black mb-2">{t("catalog.flavor")}</p>
              <div className="flex flex-wrap gap-1.5">
                <Link href={buildUrl(currentParams, { flavor: "all" })} className={`px-2.5 py-1 rounded-full text-xs font-bold border ${!flavor || flavor === "all" ? "bg-[#121212] text-white border-[#121212]" : "bg-white border-[#A6B4C0]/30"}`}>{t("actions.all")}</Link>
                {allFlavors.map(f => (
                  <Link key={f} href={buildUrl(currentParams, { flavor: f })} className={`px-2.5 py-1 rounded-full text-xs font-bold border ${flavor === f ? "bg-[#E51D25] text-white border-[#E51D25]" : "bg-white border-[#A6B4C0]/30"}`}>
                    {f}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-black mb-2">{t("catalog.byPrice")}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: t("actions.all"), value: undefined },
                  { label: "≤ 7,000", value: "7000" },
                  { label: "≤ 10,000", value: "10000" },
                  { label: "≤ 15,000", value: "15000" },
                  { label: "≤ 20,000", value: "20000" },
                  { label: "≤ 30,000", value: "30000" },
                ].map(p => (
                  <Link
                    key={p.label}
                    href={buildUrl(currentParams, { maxPrice: p.value })}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${maxPrice === p.value ? "bg-[#E51D25] text-white border-[#E51D25]" : !maxPrice && !p.value ? "bg-[#121212] text-white" : "bg-white border-[#A6B4C0]/30"}`}
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-[#A6B4C0]/20">
              <p className="text-sm font-black mb-2">{t("catalog.sort")}</p>
              <div className="space-y-1">
                {[
                  { label: t("catalog.sortDefault"), value: undefined },
                  { label: t("catalog.priceAsc"), value: "price-asc" },
                  { label: t("catalog.priceDesc"), value: "price-desc" },
                  { label: t("catalog.topRated"), value: "rating" },
                ].map(s => (
                  <Link
                    key={s.label}
                    href={buildUrl(currentParams, { sort: s.value })}
                    className={`block px-3 py-2 rounded-xl text-xs font-bold ${sort === s.value ? "bg-[#121212] text-white" : !sort && !s.value ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between bg-white border border-[#A6B4C0]/20 rounded-full px-4 py-2">
            <span className="text-sm font-bold">{filtered.length} {t("catalog.items")}</span>
            <span className="text-xs text-zinc-500 flex items-center gap-1"><IconStar className="h-3 w-3 text-[#E51D25]" filled /> {t("catalog.authentic")}</span>
          </div>

          {(() => {
            const PAGE_SIZE = 12
            const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
            const curPage = Math.min(page, totalPages)
            const paginated = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)
            if (filtered.length === 0) return (
              <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-12 text-center mt-6">
                <div className="h-12 w-12 mx-auto rounded-full bg-[#FFFFFF] border border-[#A6B4C0] flex items-center justify-center"><IconSearch className="h-5 w-5" /></div>
                <p className="font-black mt-3">{t("catalog.emptyT")}</p>
                <p className="text-sm text-zinc-500 mt-1">{t("catalog.emptyS")}</p>
                <Link href="/products" className="inline-block mt-4 bg-[#E51D25] text-white px-6 py-2 rounded-full text-sm font-black">{t("catalog.clearFilters")}</Link>
              </div>
            )
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                  {paginated.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Link href={buildUrl(currentParams, { page: String(Math.max(1, curPage - 1)) })} className={`px-4 py-2 rounded-full text-xs font-black border ${curPage === 1 ? "opacity-30 pointer-events-none" : "bg-white hover:bg-[#FFFFFF]"}`}>{t("actions.prev")}</Link>
                    <span className="text-xs font-bold bg-[#121212] text-white px-3 py-1 rounded-full">{curPage} / {totalPages}</span>
                    <Link href={buildUrl(currentParams, { page: String(Math.min(totalPages, curPage + 1)) })} className={`px-4 py-2 rounded-full text-xs font-black border ${curPage === totalPages ? "opacity-30 pointer-events-none" : "bg-white hover:bg-[#FFFFFF]"}`}>{t("actions.next")}</Link>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
