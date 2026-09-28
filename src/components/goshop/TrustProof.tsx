"use client"
import { IconStar, IconUsers, IconShield, IconTruck } from "@/components/Icons"
import { useI18n } from "@/i18n/LanguageProvider"

export function GoshopTrustProof() {
  const { d } = useI18n()
  const icons = [IconStar, IconUsers, IconShield, IconTruck]
  return (
    <section className="border-y border-zinc-100 bg-[#F8F9FA]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:py-10">
        {d.trust.map((s, i) => {
          const Ic = icons[i % icons.length]
          return (
            <div key={s.label} className="flex items-center gap-4">
              <span className="shrink-0 text-[#121212]">
                <Ic className="h-8 w-8" />
              </span>
              <div>
                <p className="text-xl font-extrabold tracking-tight text-[#121212] md:text-2xl">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-zinc-600 md:text-sm">
                  {s.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
