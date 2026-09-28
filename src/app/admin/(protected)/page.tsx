"use client"
import Link from "next/link"
import { useProducts } from "@/hooks/useProducts"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"
import { AdminAlerts } from "@/components/AdminAlerts"
import Image from "next/image"

export default function AdminOverview() {
  const { t, fp } = useI18n()
  const products = useProducts()
  const totalStock = products.reduce((s, p) => s + p.variants.reduce((a, v) => a + v.stock, 0), 0)
  const lowStock = products.filter(p => p.variants.some(v => v.stock < 5)).length
  const [ordersCount, setOrdersCount] = useState<number | null>(null)
  const [promo, setPromo] = useState<string>("FIT10 - 10%")
  const [neonStatus, setNeonStatus] = useState<"ok" | "fail" | "loading">("loading")

  useEffect(() => {
    async function load() {
      try {
        const [oRes, pRes] = await Promise.all([
          fetch("/api/orders?admin=1&limit=1", { cache: "no-store" }),
          fetch("/api/promos?admin=1", { cache: "no-store" }),
        ])
        if (oRes.ok) {
          const d = await oRes.json()
          setOrdersCount(d.pagination?.total ?? d.orders?.length ?? 0)
          setNeonStatus("ok")
        } else setNeonStatus("fail")
        if (pRes.ok) {
          const d2 = await pRes.json()
          const active = d2.promos?.find((p: { active: boolean; code: string; discount: number }) => p.active)
          if (active) setPromo(`${active.code} - ${active.discount}%`)
        }
      } catch {
        setNeonStatus("fail")
      }
    }
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-black">{t("adminOverview.title")}</h1>
      <p className="text-sm text-zinc-600">{t("adminOverview.welcome")}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
        <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-4 sm:p-5">
          <p className="text-xs text-zinc-500">{t("adminOverview.totalProducts")}</p>
          <p className="text-xl sm:text-2xl font-black mt-1">{products.length}</p>
          <p className="text-xs text-emerald-600 mt-1">{products.length} {t("adminOverview.activeProducts")}</p>
        </div>
        <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-4 sm:p-5">
          <p className="text-xs text-zinc-500">{t("adminOverview.totalStock")}</p>
          <p className="text-xl sm:text-2xl font-black mt-1">{totalStock}</p>
          <p className="text-xs text-zinc-500 mt-1">{t("adminOverview.unit")}</p>
        </div>
        <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-4 sm:p-5">
          <p className="text-xs text-zinc-500">{t("adminOverview.lowStock")}</p>
          <p className="text-xl sm:text-2xl font-black mt-1 text-[#E51D25]">{lowStock}</p>
          <p className="text-xs text-amber-600">{t("adminOverview.refill")}</p>
        </div>
        <div className="bg-[#E51D25] border border-[#A6B4C0] rounded-2xl p-4 sm:p-5">
          <p className="text-xs text-black/70">{t("adminOverview.promoActive")}</p>
          <p className="text-xl font-black mt-1">{promo}</p>
          <p className="text-xs text-black/60">{t("adminOverview.syncedDb")}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 mt-4 sm:mt-6 md:grid-cols-2">
        <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-4 sm:p-5">
          <h3 className="font-black">{t("adminOverview.quickActions")}</h3>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 mt-4">
            <Link href="/admin/products" className="bg-[#121212] text-white py-3.5 rounded-xl text-center text-sm font-black min-h-[52px] flex items-center justify-center">{t("adminOverview.addProduct")}</Link>
            <Link href="/admin/promos" className="bg-[#E51D25] text-white py-3.5 rounded-xl text-center text-sm font-black min-h-[52px] flex items-center justify-center">{t("adminOverview.addPromo")}</Link>
            <Link href="/admin/orders" className="border border-[#A6B4C0]/30 py-3.5 rounded-xl text-center text-sm font-bold min-h-[52px] flex items-center justify-center">{t("adminOverview.viewOrders")}</Link>
            <Link href="/products" className="border border-[#A6B4C0]/30 py-3.5 rounded-xl text-center text-sm font-bold min-h-[52px] flex items-center justify-center">{t("adminOverview.previewStore")}</Link>
          </div>
        </div>

        <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-4 sm:p-5">
          <h3 className="font-black">{t("adminOverview.topProducts")}</h3>
          <div className="space-y-2 mt-4">
            {products.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center gap-3 border border-[#A6B4C0]/10 rounded-xl p-2">
                <Image src={p.images[0]} alt={p.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold line-clamp-1">{p.name}</p>
                  <p className="text-xs text-zinc-500">{p.brand} • {p.rating} ★</p>
                </div>
                <span className="ms-auto shrink-0 text-xs font-black bg-[#FFFFFF] border border-[#A6B4C0]/30 px-2 py-1 rounded-full">{fp(p.variants[0].price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AdminAlerts />

      <div className="mt-4 sm:mt-6 bg-[#121212] text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black">{t("adminOverview.systemStatus")}</p>
          <p className="text-xs text-white/60">Neon PostgreSQL: {neonStatus === "loading" ? t("adminOverview.neonLoading") : neonStatus === "ok" ? t("adminOverview.neonOk") : t("adminOverview.neonFail")} • {t("adminOverview.ordersLabel")}: {ordersCount ?? "—"} • {t("adminOverview.stockLabel")}: {totalStock} {t("adminOverview.unit")}</p>
        </div>
        <span className={`shrink-0 px-4 py-2 rounded-full text-xs font-black ${neonStatus === "ok" ? "bg-emerald-500 text-white" : "bg-[#E51D25] text-white"}`}>{neonStatus === "ok" ? t("adminOverview.dbOk") : t("adminOverview.buildOk")}</span>
      </div>
    </div>
  )
}
