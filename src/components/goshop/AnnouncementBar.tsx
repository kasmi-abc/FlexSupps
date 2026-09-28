"use client"
import { IconGift, IconTruck, IconStar, IconZap } from "@/components/Icons"
import { useI18n } from "@/i18n/LanguageProvider"

export function GoshopAnnouncementBar() {
  const { d } = useI18n()
  const icons = [IconTruck, IconZap, IconGift, IconStar]
  return (
    <div className="border-t-2 border-[#E51D25] bg-[#F8F9FA]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-x-4 gap-y-2 px-4 py-2.5 md:grid-cols-4">
        {d.announce.map((text, i) => {
          const Ic = icons[i % icons.length]
          return (
            <div
              key={text}
              className="flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-[#121212] sm:text-xs"
            >
              <span className="text-[#E51D25]">
                <Ic className="h-[18px] w-[18px]" />
              </span>
              <span>{text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
