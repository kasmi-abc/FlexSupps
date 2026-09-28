"use client"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"

export default function AdminStats() {
  const { t, fp, statusLabel } = useI18n()
  const [s, setS] = useState<{
    revenue: number
    orders: Record<string, number>
    deliveredCount: number
    top: { name: string; qty: number; revenue: number }[]
    profit: number
    marginPct: number
  } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/stats", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setS(d) })
        .catch(() => {})
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  if (!s) return <p className="text-sm text-center py-8">...</p>

  return (
    <div>
      <h1 className="text-xl font-black">{t("stats.title")}</h1>
      <p className="text-sm text-zinc-500">{t("stats.sub")}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5">
          <p className="text-xs text-zinc-500">{t("stats.revenue")}</p>
          <p className="text-2xl font-black mt-1 text-[#E51D25]">{fp(s.revenue)}</p>
          <p className="text-xs text-zinc-500 mt-1">{s.deliveredCount} {t("stats.delivered")}</p>
        </div>
        <div className="bg-[#137333] text-white rounded-2xl p-5">
          <p className="text-xs text-white/70">{t("stats.profit")}</p>
          <p className="text-2xl font-black mt-1">{fp(s.profit)}</p>
          <p className="text-xs text-white/70 mt-1">{t("stats.margin")}: {s.marginPct}%</p>
        </div>
        <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5 col-span-2">
          <p className="text-xs text-zinc-500">{t("stats.ordersByStatus")}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(s.orders).map(([k, v]) => (
              <span key={k} className="bg-[#FFFFFF] border border-[#A6B4C0]/30 px-3 py-1 rounded-full text-xs font-black">
                {statusLabel(k)}: {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5 mt-6">
        <h3 className="font-black">{t("stats.topProducts")}</h3>
        <div className="mt-3 space-y-2">
          {s.top.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3 border-b border-[#A6B4C0]/10 pb-2 last:border-0">
              <span className="h-7 w-7 rounded-full bg-[#121212] text-white text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
              <p className="text-sm font-bold flex-1 line-clamp-1">{p.name}</p>
              <span className="text-xs text-zinc-500">{p.qty} {t("stats.qty")}</span>
              <span className="text-sm font-black text-[#E51D25]">{fp(p.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
