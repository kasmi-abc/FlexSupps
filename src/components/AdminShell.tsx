"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        const ok = res.ok
        if (!cancelled) {
          setAuthed(ok)
          if (!ok) router.replace("/admin/login")
        }
      } catch {
        if (!cancelled) {
          setAuthed(false)
          router.replace("/admin/login")
        }
      }
    }
    check()
    return () => { cancelled = true }
  }, [pathname, router])

  if (authed === null) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-center text-sm">{t("adminShell.verifying")}</div>
  }

  if (!authed) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-center text-sm">{t("adminShell.mustLogin")}</div>
  }

  const isActive = (href: string) => pathname === href

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6">
      <div className="bg-[#121212] text-white rounded-2xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/flex-supps-logo.jpg" alt="Flex Supps" width={40} height={40} className="h-10 w-10 rounded-xl border-2 border-[#E51D25] object-cover shrink-0" />
          <div className="min-w-0">
            <p className="font-black truncate">{t("adminShell.title")}</p>
            <p className="text-xs text-white/60 truncate">{t("adminShell.sub")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" })
              router.push("/admin/login")
              router.refresh()
            }}
            className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold"
          >
            {t("adminShell.logout")}
          </button>
          <Link href="/" className="bg-white text-black px-4 py-2 rounded-full text-xs font-black">{t("adminShell.store")}</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-4 sm:gap-6 mt-4 sm:mt-6">
        <aside className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-2 sm:p-3 h-fit lg:sticky lg:top-24">
          <nav className="no-scrollbar flex gap-1 overflow-x-auto text-sm font-bold lg:grid lg:space-y-1 lg:overflow-visible">
            <Link href="/admin" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminShell.overview")}</Link>
            <Link href="/admin/products" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin/products") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminShell.products")}</Link>
            <Link href="/admin/orders" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin/orders") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminShell.orders")}</Link>
            <Link href="/admin/returns" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin/returns") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminNav.returns")}</Link>
            <Link href="/admin/stock" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin/stock") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminNav.stock")}</Link>
            <Link href="/admin/clients" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin/clients") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminNav.clients")}</Link>
            <Link href="/admin/stats" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin/stats") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminNav.stats")}</Link>
            <Link href="/admin/reviews" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin/reviews") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminNav.reviews")}</Link>
            <Link href="/admin/blog" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin/blog") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminNav.blog")}</Link>
            <Link href="/admin/messages" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin/messages") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminNav.messages")}</Link>
            <Link href="/admin/promos" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl flex items-center gap-2 ${isActive("/admin/promos") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminShell.promos")} <span className="bg-[#E51D25] text-white text-[10px] px-1.5 py-0.5 rounded-full">FIT10</span></Link>
            <Link href="/admin/settings" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin/settings") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("adminNav.settings")}</Link>
            <Link href="/admin/security" className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl ${isActive("/admin/security") ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("twoFactor.nav")}</Link>
          </nav>
        </aside>
        <div className="admin-area min-w-0 bg-[#F8F9FA] border border-[#A6B4C0]/10 rounded-2xl p-3 sm:p-6 min-h-[500px]">{children}</div>
      </div>
    </div>
  )
}
