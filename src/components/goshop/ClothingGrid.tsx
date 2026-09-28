"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useI18n } from "@/i18n/LanguageProvider"
import { IconCart, IconHeart, IconStar, IconTag } from "@/components/Icons"
import { Dict } from "@/i18n/dict"

type Item = Dict["clothingData"][number]

function ClothingCard({ item, onAdd }: { item: Item; onAdd: (name: string) => void }) {
  const { t, fp } = useI18n()
  const [wished, setWished] = useState(false)
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all duration-300 hover:shadow-lg max-sm:w-[80%] max-sm:shrink-0 max-sm:snap-center">
      <div className="relative overflow-hidden bg-[#F8F9FA]">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={item.image}
            alt={item.name}
            loading="lazy"
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-0"
          />
          <Image
            src={item.imageHover}
            alt=""
            aria-hidden="true"
            loading="lazy"
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw"
            className="scale-105 object-cover opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
          />
        </div>
        <span className="absolute start-3 top-3 flex items-center gap-1 rounded-full bg-[#E51D25] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-sm">
          <IconTag className="h-3.5 w-3.5" />
          {item.discount}
        </span>
        <button
          onClick={() => setWished(!wished)}
          aria-label={wished ? t("clothing.removeWish") : t("clothing.addWish")}
          className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-100 bg-white shadow-sm transition-all hover:scale-105 active:scale-95"
        >
          <span className={wished ? "text-red-600" : "text-zinc-400"}>
            <IconHeart className="h-4 w-4" filled={wished} />
          </span>
        </button>
        <button
          onClick={() => onAdd(item.name)}
          className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-2 rounded-full bg-[#121212] py-2.5 text-[12px] font-extrabold tracking-widest text-white opacity-0 backdrop-blur transition-all duration-300 hover:opacity-90 group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100"
        >
          <IconCart className="h-4 w-4" />
          {t("clothing.quickAdd")}
        </button>
      </div>
      <div className="flex flex-1 flex-col px-4 py-3.5">
        <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-snug tracking-tight text-[#121212]">
          {item.name}
        </h3>
        <div className="mt-1 flex items-center gap-1">
          <span className="flex items-center gap-0.5 text-[#121212]">
            {[0, 1, 2, 3, 4].map((i) => (
              <IconStar key={i} className="h-3 w-3" filled={i < Math.round(item.rating)} />
            ))}
          </span>
          <span className="text-[11px] text-[#777777]">({item.reviews})</span>
        </div>
        <div className="mt-1.5 text-center">
          <p className="text-lg font-extrabold tracking-tight text-[#121212]">
            {fp(item.price)}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="rounded-[4px] border border-red-400 px-1.5 py-0.5 text-[11px] font-bold text-red-500 line-through">
              {t("clothing.before")} {fp(item.was)}
            </span>
            <span className="rounded-[4px] border border-[#137333] bg-[#E6F4EA] px-1.5 py-0.5 text-[11px] font-bold text-[#137333]">
              {t("clothing.save")} {fp(item.was - item.price)}
            </span>
          </div>
        </div>
      </div>
      <p className="border-t border-zinc-100 bg-[#F8F9FA] px-2 py-2 text-center text-[9.5px] font-bold leading-tight tracking-wide text-[#121212]">
        {t("clothing.strip")}
      </p>
    </div>
  )
}

export function GoshopClothingGrid({ onAdd }: { onAdd: (name: string) => void }) {
  const { t, d } = useI18n()
  return (
    <section className="bg-[#F8F9FA] py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#121212] md:text-[32px]">
              {t("clothing.title")}
            </h2>
            <p className="mt-1 text-[13px] text-[#666666]">
              {t("clothing.sub")}
            </p>
          </div>
          <Link
            href="/products"
            className="rounded-full border border-zinc-300 bg-white px-6 py-2.5 text-xs font-extrabold tracking-[0.18em] text-[#121212] transition-all hover:border-[#A6B4C0] hover:bg-[#A6B4C0]/20"
          >
            {t("clothing.viewAll")}
          </Link>
        </div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 sm:gap-5 lg:grid-cols-4">
          {d.clothingData.map((item) => (
            <ClothingCard key={item.id} item={item} onAdd={onAdd} />
          ))}
        </div>
      </div>
    </section>
  )
}
