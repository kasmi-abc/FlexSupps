"use client"
import Link from "next/link"
import Image from "next/image"
import { useI18n } from "@/i18n/LanguageProvider"
import { IconArrowRight, IconFlask } from "@/components/Icons"

export function GoshopExpertAdvice() {
  const { t, d } = useI18n()
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#E51D25]">
              {t("advice.kicker")}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#121212] md:text-[32px]">
              {t("advice.title")}
            </h2>
          </div>
          <Link
            href="/blog"
            className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide text-[#121212] hover:text-[#E51D25]"
          >
            {t("advice.viewAll")} <IconArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {d.articles.map((a) => (
            <Link
              key={a.id}
              href={a.href}
              className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all duration-300 hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={a.image}
                  alt={a.title}
                  loading="lazy"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.18em] text-[#121212]">
                    <IconFlask className="h-4 w-4" />
                    {a.kicker}
                  </p>
                  <span className="text-[11px] font-medium text-zinc-400">{a.readTime}</span>
                </div>
                <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight text-[#121212]">
                  {a.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-600">
                  {a.excerpt}
                </p>
                <span className="mt-3 flex items-center gap-1.5 text-[13px] font-extrabold text-[#121212] transition-colors group-hover:text-[#E51D25]">
                  {t("advice.read")} <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
