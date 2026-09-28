"use client"
import { useState } from "react"
import { useProducts } from "@/hooks/useProducts"
import { useI18n } from "@/i18n/LanguageProvider"
import { IconCheck } from "@/components/Icons"
import { GoshopAnnouncementBar } from "@/components/goshop/AnnouncementBar"
import { HeroCarousel } from "@/components/goshop/HeroCarousel"
import { PerksBar } from "@/components/goshop/PerksBar"
import { GoshopPromoGrid } from "@/components/goshop/PromoGrid"
import { GoshopShopTabs } from "@/components/goshop/ShopTabs"
import { GoshopClothingGrid } from "@/components/goshop/ClothingGrid"
import { GoshopBundles } from "@/components/goshop/Bundles"
import { GoshopPromoStrip } from "@/components/goshop/PromoStrip"
import { GoshopTrustProof } from "@/components/goshop/TrustProof"
import { GoshopExpertAdvice } from "@/components/goshop/ExpertAdvice"
import { GoshopAppPromo } from "@/components/goshop/AppPromo"
import { StoreLocation } from "@/components/goshop/StoreLocation"

export default function Home() {
  const products = useProducts()
  const { t, lang } = useI18n()
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (name: string) => {
    setToast(name)
    if (typeof window !== "undefined") {
      clearTimeout((window as unknown as { __toastTimer?: number }).__toastTimer)
      ;(window as unknown as { __toastTimer?: number }).__toastTimer = window.setTimeout(
        () => setToast(null),
        2200
      )
    }
  }

  return (
    <div className={`min-h-screen bg-[#F8F9FA] text-[#121212] ${lang === "ar" ? "font-[var(--font-cairo)]" : "font-[var(--font-inter)]"}`}>
      <GoshopAnnouncementBar />

      <main>
        <HeroCarousel />
        <PerksBar />
        <GoshopPromoGrid />
        <GoshopShopTabs products={products} />
        <GoshopClothingGrid onAdd={showToast} />
        <GoshopBundles onAdd={showToast} />
        <GoshopPromoStrip />
        <GoshopTrustProof />
        <GoshopExpertAdvice />
        <GoshopAppPromo />
        <StoreLocation />
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full bg-[#121212] py-3 pl-4 pr-6 text-white shadow-2xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#137333]">
              <IconCheck className="h-4 w-4" />
            </span>
            <p className="max-w-64 truncate text-[13px] font-bold">{toast} — {t("toastAdded")}</p>
          </div>
        </div>
      )}
    </div>
  )
}
