"use client"
import { IconZap } from "@/components/Icons"
import { useI18n } from "@/i18n/LanguageProvider"

export function GoshopPromoStrip() {
  const { t } = useI18n()
  return (
    <div className="bg-[#E51D25] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-1 px-4 py-2.5 text-center text-[11px] font-extrabold uppercase tracking-widest sm:text-xs">
        <span className="flex items-center gap-1.5">
          <IconZap className="h-3.5 w-3.5" /> {t("strip.sale")}
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">{t("strip.code")}</span>
        <span className="hidden md:inline">·</span>
        <span className="hidden md:inline">{t("strip.ship")}</span>
      </div>
    </div>
  )
}
