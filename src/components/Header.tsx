"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useCartStore } from "@/store/cart"
import { useWishlist } from "@/store/wishlist"
import { useI18n } from "@/i18n/LanguageProvider"
import {
  IconSearch, IconHeart, IconCart, IconUser, IconZap, IconGift, IconDumbbell,
} from "@/components/Icons"

function SearchPill({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter()
  const { t } = useI18n()
  const [q, setQ] = useState("")
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        router.push(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products")
      }}
      className={`items-center gap-2 rounded-full bg-[#F8F9FA] py-1.5 pl-4 pr-1.5 ${mobile ? "flex md:hidden" : "hidden md:flex md:w-56 lg:w-72"}`}
    >
      <span className="text-[#E51D25]">
        <IconSearch className="h-[18px] w-[18px]" />
      </span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("header.searchPh")}
        className="w-full min-w-0 bg-transparent text-[13px] text-[#121212] outline-none placeholder:text-gray-400"
      />
      <Link
        href="/goals"
        className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#121212] shadow-sm hover:shadow"
      >
        <span className="text-[#E51D25]">
          <IconZap className="h-3.5 w-3.5" />
        </span>
        {t("header.fuelCoach")}
      </Link>
    </form>
  )
}

function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, toggle, t } = useI18n()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch language / تغيير اللغة"
      title="FR ⇄ عربي"
      className={`flex items-center gap-1 rounded-full border-2 border-[#E51D25] font-black text-[#121212] transition-all hover:bg-[#E51D25] hover:text-white active:scale-95 ${
        compact ? "px-2 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-xs" : "px-3.5 py-1.5 text-xs"
      }`}
    >
      <span className={lang === "fr" ? "opacity-40" : ""}>ع</span>
      <span className="text-[#E51D25]">⇄</span>
      <span className={lang === "ar" ? "opacity-40" : ""}>FR</span>
      <span className="sr-only">{t("langBtn")}</span>
    </button>
  )
}

export function Header() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { count } = useCartStore()
  const { count: wishCount } = useWishlist()
  const c = count()
  const w = wishCount
  const [open, setOpen] = useState(false)

  const mainLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.products"), href: "/products" },
    { label: t("nav.bundles"), href: "/bundles" },
    { label: t("nav.goals"), href: "/goals" },
    { label: t("nav.orders"), href: "/orders" },
    { label: t("nav.blog"), href: "/blog" },
  ]

  const subLinks = [
    { label: t("sub.trending"), href: "/products", icon: true },
    { label: t("sub.protein"), href: "/products?category=protein" },
    { label: t("sub.supplements"), href: "/products" },
    { label: t("sub.vitamins"), href: "/products?category=vitamins" },
    { label: t("sub.bars"), href: "/products" },
    { label: t("sub.snacks"), href: "/products" },
    { label: t("sub.accessories"), href: "/products" },
    { label: t("sub.clearance"), href: "/bundles" },
    { label: t("sub.expert"), href: "/blog" },
  ]

  const isAdmin = pathname.startsWith("/admin")
  if (isAdmin) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 h-[56px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/flex-supps-logo.jpg" alt="Flex Supps" width={36} height={36} className="h-9 w-9 rounded-xl border-2 border-[#E51D25] object-cover" />
            <span className="font-black text-sm tracking-widest text-[#121212]">Flex Supps</span>
          </Link>
          <div className="flex items-center gap-3">
            <LangSwitch compact />
            <span className="text-xs font-bold text-[#E51D25]">{t("adminShell.adminMode")}</span>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* strip */}
      <div className="bg-[#E51D25] text-white text-[11px] font-extrabold overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-6 whitespace-nowrap">
          <span className="hidden sm:inline">{t("header.strip1")}</span>
          <span className="hidden sm:inline">·</span>
          <span>{t("header.strip2")}</span>
          <span>·</span>
          <span className="hidden md:inline">{t("header.strip3")}</span>
        </div>
      </div>

      <div className="border-b border-gray-100 bg-white">
        {/* row 1 */}
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image src="/flex-supps-logo.jpg" alt="Flex Supps" width={44} height={44} className="h-11 w-11 rounded-xl object-cover border-2 border-[#E51D25]" />
            <span className="block text-[20px] font-black tracking-widest text-[#121212]">
              Flex Supps
            </span>
          </Link>

          <nav className="hidden min-w-0 items-center justify-center gap-4 lg:flex">
            {mainLinks.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    active
                      ? "rounded-full border-2 border-[#E51D25] bg-[#E51D25]/10 px-5 py-2 text-[12px] font-extrabold tracking-wide text-[#121212]"
                      : "px-1 py-2 text-[12px] font-extrabold tracking-wide text-[#121212]/80 hover:text-[#121212]"
                  }
                >
                  {l.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center justify-end gap-1.5">
            <SearchPill />
            <LangSwitch compact />
            <Link href="/orders" aria-label={t("header.account")} className="rounded-full p-2 text-[#121212] transition-colors hover:bg-gray-100">
              <IconUser className="h-5 w-5" />
            </Link>
            <Link href="/wishlist" aria-label={t("header.wishlist")} className="relative rounded-full p-2 text-[#121212] transition-colors hover:bg-gray-100">
              <IconHeart className="h-5 w-5" />
              {w > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E51D25] px-1 text-[10px] font-bold text-white">
                  {w}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              aria-label={t("header.cart")}
              key={c}
              className="relative rounded-full p-2 text-[#121212] transition-colors hover:bg-gray-100"
              style={{ animation: "fadeSlide 0.35s ease" }}
            >
              <IconCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E51D25] text-[11px] font-bold text-white">
                {c}
              </span>
            </Link>
            <button onClick={() => setOpen(!open)} className="rounded-md p-2 hover:bg-gray-100 lg:hidden" aria-label={t("header.menu")}>
              <div className="space-y-1">
                <div className="h-0.5 w-5 bg-[#121212]" />
                <div className="h-0.5 w-5 bg-[#121212]" />
                <div className="h-0.5 w-5 bg-[#121212]" />
              </div>
            </button>
          </div>
        </div>

        {/* row 2 */}
        <nav className="no-scrollbar mx-auto hidden max-w-7xl items-center justify-center gap-6 overflow-x-auto border-t border-gray-100 px-4 py-2.5 lg:flex">
          {subLinks.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-extrabold text-[#121212] hover:text-[#E51D25] hover:underline hover:underline-offset-4"
            >
              {s.icon && (
                <span className="relative flex items-center text-[#121212]">
                  <IconGift className="h-[15px] w-[15px]" />
                  <IconDumbbell className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-[30%] text-[#121212]" />
                </span>
              )}
              {s.label}
            </Link>
          ))}
        </nav>

        {/* mobile search */}
        <div className="px-4 pb-3 md:hidden">
          <SearchPill mobile />
        </div>

        {/* mobile menu */}
        {open && (
          <div className="space-y-3 border-t border-gray-100 px-4 py-3 lg:hidden">
            <div className="flex flex-wrap gap-2">
              {mainLinks.map((l) => {
                const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={
                      active
                        ? "rounded-full border-2 border-[#E51D25] bg-[#E51D25]/10 px-5 py-1.5 text-xs font-extrabold"
                        : "rounded-full bg-gray-100 px-5 py-2 text-xs font-extrabold text-[#121212]/70"
                    }
                  >
                    {l.label}
                  </Link>
                )
              })}
              <LangSwitch />
            </div>
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
              {subLinks.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  onClick={() => setOpen(false)}
                  className="shrink-0 whitespace-nowrap text-xs font-extrabold text-[#121212]"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
