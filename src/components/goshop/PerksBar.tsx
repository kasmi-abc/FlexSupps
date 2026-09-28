"use client"
import { IconTruck, IconFlag, IconBox, IconShield } from "@/components/Icons"
import { useI18n } from "@/i18n/LanguageProvider"

// perks strip
export function PerksBar() {
  const { d } = useI18n()
  const icons = [IconTruck, IconFlag, IconBox, IconShield]
  return (
    <section className="w-full bg-[#F8F9FA]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-7 md:grid-cols-4 md:py-9">
        {d.perksbar.map((p, i) => {
          const Ic = icons[i % icons.length]
          return (
            <div key={p.t} className="flex items-center gap-4">
              <span className="shrink-0 text-[#121212]">
                <Ic className="h-10 w-10" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-black uppercase leading-tight tracking-wide text-black sm:text-sm">
                  {p.t}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase leading-snug tracking-wide text-zinc-500 sm:text-xs">
                  {p.s}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
