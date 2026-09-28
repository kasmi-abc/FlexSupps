"use client"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useProducts } from "@/hooks/useProducts"
import { addToCartDirect } from "@/store/cart"
import { useI18n } from "@/i18n/LanguageProvider"
import { Dict } from "@/i18n/dict"

type Bundle = Dict["packs"][number]

export default function BundlesPage() {
  const { t, d, fp } = useI18n()
  const [toast, setToast] = useState<string | null>(null)
  const products = useProducts()
  const bundles: Bundle[] = d.packs

  const handleAddPack = (bundle: Bundle) => {
    let added = 0
    bundle.productSlugs.forEach(slug => {
      const p = products.find(pr => pr.slug === slug)
      if (!p) return
      const v = p.variants.find(vv => vv.isDefault) || p.variants[0]
      addToCartDirect({
        productId: p.id,
        variantId: v.id,
        name: p.name,
        variantName: v.name,
        image: p.images[0],
        price: v.price,
        quantity: 1,
        isSubscription: false,
      })
      added++
    })
    setToast(`${bundle.name} (${added}) — ${t("bundlesPage.addedTo")} ${t("toastAdded")}`)
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#121212] text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg z-50 border-2 border-[#E51D25]">
          {toast} <Link href="/cart" className="underline ms-2 text-[#E51D25]">{t("detail.viewCart")}</Link>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-3xl font-black">{t("bundlesPage.title")}</h1>
        <p className="text-sm text-zinc-600 mt-2">{t("bundlesPage.sub")}</p>
        <p className="inline-block mt-3 bg-[#E51D25] text-white text-xs font-black px-3 py-1 rounded-full">{t("bundlesPage.saveBanner")}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-10">
        {bundles.map(b => (
          <div key={b.id} className={`bg-white border-2 rounded-3xl overflow-hidden ${b.popular ? "border-[#E51D25] shadow-lg" : "border-[#A6B4C0]/20"}`}>
            {b.popular && <div className="bg-[#E51D25] text-white text-center py-1.5 text-xs font-black">{t("bundlesPage.popular")}</div>}
            <Image src={b.image} alt={b.name} width={640} height={320} className="w-full h-44 object-cover" />
            <div className="p-6">
              <span className="bg-[#121212] text-white text-xs font-black px-2.5 py-1 rounded-full">{b.badge}</span>
              <h3 className="font-black text-lg mt-3">{b.name}</h3>
              <p className="text-xs text-zinc-500 mt-1">{b.desc}</p>
              <ul className="mt-4 space-y-2">
                {b.items.map(it => (
                  <li key={it} className="flex items-center gap-2 text-sm">
                    <span className="h-5 w-5 rounded-full bg-[#FFFFFF] border border-[#A6B4C0] flex items-center justify-center text-[10px]">✓</span> {it}
                  </li>
                ))}
              </ul>
              <div className="mt-6 bg-[#FFFFFF] border border-[#A6B4C0]/30 rounded-xl p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#E51D25]">{fp(b.price)}</span>
                  <span className="text-sm line-through text-zinc-400">{fp(b.oldPrice)}</span>
                </div>
                <p className="text-xs font-bold text-emerald-600 mt-1">{t("bundlesPage.save")} {b.saving}</p>
              </div>
              <button type="button" onClick={() => handleAddPack(b)} className={`w-full mt-4 py-3 rounded-full font-black text-sm ${b.popular ? "bg-[#E51D25] text-white" : "bg-[#121212] text-white"}`}>{t("bundlesPage.addPack")}</button>
              <Link href="/products" className="block text-center text-xs underline mt-2">{t("bundlesPage.orSingle")}</Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-white border border-[#A6B4C0]/20 rounded-2xl p-6 grid md:grid-cols-3 gap-6 text-center">
        {d.bundlesPage.bottom.map(b => (
          <div key={b.t}><p className="font-black">{b.t}</p><p className="text-xs text-zinc-500">{b.s}</p></div>
        ))}
      </div>
    </div>
  )
}
