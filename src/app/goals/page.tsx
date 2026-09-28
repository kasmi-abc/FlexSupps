"use client"
import Link from "next/link"
import Image from "next/image"
import { useProducts } from "@/hooks/useProducts"
import { useI18n } from "@/i18n/LanguageProvider"
import { IconMuscle, IconFire, IconZap, IconApple } from "@/components/Icons"

export default function GoalsPage() {
  const { t, d, fp } = useI18n()
  const products = useProducts()
  const goals = [
    { slug: "MUSCLE_GAIN", icon: IconMuscle, color: "bg-[#121212] text-[#E51D25]" },
    { slug: "WEIGHT_LOSS", icon: IconFire, color: "bg-[#E51D25] text-white" },
    { slug: "ENERGY", icon: IconZap, color: "bg-[#E51D25] text-white" },
    { slug: "GENERAL", icon: IconApple, color: "bg-white border-2 border-[#A6B4C0] text-[#121212]" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-black">{t("goalsPage.title")}</h1>
      <p className="text-sm text-zinc-600 mt-1">{t("goalsPage.sub")}</p>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {goals.map((g) => {
          const list = products.filter((p) => p.goal === g.slug)
          const label = d.goals[g.slug]?.label || g.slug
          const desc = d.goals[g.slug]?.desc || ""
          return (
            <div key={g.slug} className="bg-white border border-[#A6B4C0]/20 rounded-3xl overflow-hidden">
              <div className={`p-6 flex items-center gap-4 ${g.color}`}>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center"><g.icon className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-black">{label}</h3>
                  <p className="text-xs opacity-80">{desc} • {list!.length} {t("goalsPage.productsUnit")}</p>
                </div>
                <Link href={`/products?goal=${g.slug}`} className="ms-auto bg-white text-black px-4 py-2 rounded-full text-xs font-black">{t("goalsPage.shop")}</Link>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {list!.slice(0, 2).map(p => (
                  <Link key={p.id} href={`/products/${p.slug}`} className="border border-[#A6B4C0]/20 rounded-xl p-2 flex gap-2 hover:border-[#E51D25]">
                    <Image src={p.images[0]} alt={p.name} width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="text-xs font-black line-clamp-1">{p.name}</p>
                      <p className="text-xs text-[#E51D25] font-bold">{fp(p.variants[0].price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-10 bg-[#121212] text-white rounded-2xl p-6 text-center">
        <p className="font-black">{t("goalsPage.helpT")}</p>
        <p className="text-sm text-white/70 mt-1">{t("goalsPage.helpS")}</p>
        <a href="https://wa.me/213553628299" className="inline-block mt-4 bg-[#E51D25] text-white px-6 py-2 rounded-full text-sm font-black">{t("goalsPage.whatsapp")}</a>
      </div>
    </div>
  )
}
