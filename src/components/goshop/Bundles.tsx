"use client"
import Link from "next/link"
import Image from "next/image"
import { useI18n } from "@/i18n/LanguageProvider"
import { IconCart, IconCheck, IconPlus } from "@/components/Icons"

export function GoshopBundles({ onAdd }: { onAdd: (name: string) => void }) {
  const { t, d, fp } = useI18n()
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#E51D25]">
            {t("bundlesG.kicker")}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[#121212] md:text-[32px]">
            {t("bundlesG.title")}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-[#666666]">
            {t("bundlesG.sub")}
          </p>
        </div>

        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3 lg:gap-6">
          {d.bundlesData.map((b) => (
            <div
              key={b.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:shadow-lg max-sm:w-[85%] max-sm:shrink-0 max-sm:snap-center"
            >
              <div className="flex items-center justify-center gap-1 bg-[#F8F9FA] px-4 py-6 sm:gap-2 sm:px-8">
                {b.items.map((it, i) => (
                  <div key={it.name} className="flex items-center gap-1 sm:gap-2">
                    {i > 0 && (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#121212] shadow-sm">
                        <IconPlus className="h-4 w-4" />
                      </span>
                    )}
                    <div className="flex flex-col items-center gap-1.5">
                      <Image
                        src={it.image}
                        alt={it.name}
                        loading="lazy"
                        width={192}
                        height={192}
                        className="h-20 w-20 rounded-xl border border-zinc-100 bg-white object-cover sm:h-24 sm:w-24"
                      />
                      <span className="max-w-20 truncate text-[10px] font-semibold text-[#666666] sm:max-w-24">
                        {it.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 bg-[#E6F4EA] px-4 py-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#137333] text-white">
                  <IconCheck className="h-3 w-3" />
                </span>
                <p className="text-xs font-extrabold tracking-wide text-[#137333] sm:text-[13px]">
                  {b.badge}
                </p>
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E51D25]">
                  {b.goal}
                </p>
                <h3 className="mt-1 text-lg font-extrabold tracking-tight text-[#121212] sm:text-xl">
                  {b.name}
                </h3>
                <div className="mt-2 text-center">
                  <p className="text-2xl font-black tracking-tight text-[#121212]">
                    {fp(b.price)}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="rounded-[4px] border border-red-400 px-1.5 py-0.5 text-[11px] font-bold text-red-500 line-through">
                      {t("clothing.before")} {fp(b.was)}
                    </span>
                    <span className="rounded-[4px] border border-[#137333] px-1.5 py-0.5 text-[11px] font-bold text-[#137333]">
                      {t("clothing.save")} {fp(b.save)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onAdd(`${b.name} (${b.items.length})`)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#121212] py-3.5 text-[13px] font-extrabold tracking-widest text-white transition-all hover:opacity-90 active:scale-[0.99]"
                >
                  <IconCart className="h-[18px] w-[18px]" />
                  {t("bundlesG.addBundle")}
                </button>
                <Link href="/bundles" className="mt-2 text-center text-[11px] font-bold tracking-wide text-[#E51D25] hover:underline">
                  {t("bundlesG.viewAll")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
