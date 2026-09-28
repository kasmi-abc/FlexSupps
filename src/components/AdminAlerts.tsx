"use client"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"

type Alert = { id: string; kind: string; source: string; message: string; createdAt: string; read: boolean }

export function AdminAlerts() {
  const { t, lang } = useI18n()
  const [tab, setTab] = useState<"error" | "audit">("error")
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [unread, setUnread] = useState(0)
  const [health, setHealth] = useState<{ ok: boolean; ms?: number } | null>(null)
  const [checking, setChecking] = useState(false)

  const load = async (k: "error" | "audit") => {
    try {
      const res = await fetch(`/api/alerts?kind=${k}&limit=8`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
        setUnread(data.unread || 0)
      }
    } catch {}
  }

  useEffect(() => {
    const t = setTimeout(() => { void load(tab) }, 0)
    return () => clearTimeout(t)
  }, [tab])

  const markRead = async () => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      setUnread(0)
      load(tab)
    } catch {}
  }

  const checkHealth = async () => {
    setChecking(true)
    const t0 = Date.now()
    try {
      const res = await fetch("/api/health", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      setHealth({ ok: res.ok && data.ok === true, ms: Date.now() - t0 })
    } catch {
      setHealth({ ok: false })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5 mt-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <button type="button" onClick={() => setTab("error")} className={`px-4 py-2 rounded-full text-xs font-black ${tab === "error" ? "bg-[#E51D25] text-white" : "border border-[#A6B4C0]/30"}`}>
            {t("adminOverview.alertsT")} {unread > 0 && <span className="bg-white text-[#E51D25] px-1.5 rounded-full ms-1">{unread}</span>}
          </button>
          <button type="button" onClick={() => setTab("audit")} className={`px-4 py-2 rounded-full text-xs font-black ${tab === "audit" ? "bg-[#121212] text-white" : "border border-[#A6B4C0]/30"}`}>
            {t("adminOverview.auditT")}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {health && (
            <span className={`text-xs font-bold ${health.ok ? "text-emerald-600" : "text-red-600"}`}>
              {health.ok ? `${t("adminOverview.healthOk")} (${health.ms}ms)` : t("adminOverview.healthBad")}
            </span>
          )}
          <button type="button" onClick={checkHealth} disabled={checking} className="text-xs font-bold border border-[#A6B4C0]/30 px-3 py-1.5 rounded-full hover:bg-[#FFFFFF] disabled:opacity-50">
            {checking ? "..." : t("adminOverview.checkHealth")}
          </button>
          <button type="button" onClick={markRead} className="text-xs underline text-zinc-500">{t("adminOverview.markRead")}</button>
        </div>
      </div>

      <div className="mt-4 space-y-2 max-h-64 overflow-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
        {alerts.length === 0 && <p className="text-xs text-zinc-500 text-center py-4">{t("adminOverview.alertsEmpty")}</p>}
        {alerts.map(a => (
          <div key={a.id} className={`text-xs border rounded-xl px-3 py-2 flex items-center gap-2 ${a.read ? "border-[#A6B4C0]/15 text-zinc-500" : "border-[#E51D25]/40 bg-red-50/50 font-bold"}`}>
            <span className="font-mono text-[10px] text-zinc-400 shrink-0">{a.source}</span>
            <span className="flex-1" dir="auto">{a.message}</span>
            <span className="text-[10px] text-zinc-400 shrink-0">{new Date(a.createdAt).toISOString().slice(0, 16).replace("T", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
