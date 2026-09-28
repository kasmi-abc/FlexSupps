"use client"
import Link from "next/link"
import Image from "next/image"
import { useI18n } from "@/i18n/LanguageProvider"

export function GoshopPromoGrid() {
  const { t, d } = useI18n()
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-6 text-2xl font-black tracking-tight text-[#121212] md:text-[32px]">
          {t("promo.title")}
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {d.banners.map((b) => (
            <Link key={b.id} href={b.href} className="group flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#F8F9FA]">
                <Image
                  src={b.image}
                  alt={b.title}
                  loading="lazy"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <span className="mx-auto -mt-6 z-10 max-w-[90%] truncate rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-center text-[11px] font-extrabold tracking-widest text-[#121212] shadow-sm transition-all duration-300 group-hover:border-[#121212] group-hover:bg-[#121212] group-hover:text-white sm:text-xs">
                {b.cta}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
