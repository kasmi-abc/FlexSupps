"use client"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"

type Ret = {
  id: string
  tracking: string
  name: string
  phone: string
  reason: string
  details?: string | null
  status: string
  createdAt: string
}

export default function AdminReturns() {
  const { t, statusLabel } = useI18n()
  const [list, setList] = useState<Ret[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/returns", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setList(data.returns || [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [])

  const setStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/returns?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) load()
    } catch {}
  }

  const label = (s: string) =>
    s === "approved" ? t("returns.stApproved")
    : s === "rejected" ? t("returns.stRejected")
    : s === "completed" ? t("returns.stCompleted")
    : statusLabel("pending")

  return (
    <div>
      <h1 className="text-xl font-black">{t("returns.title")}</h1>
      <p className="text-sm text-zinc-500">{t("returns.sub")}</p>

      {loading ? (
        <p className="text-sm text-center py-8">...</p>
      ) : list.length === 0 ? (
        <div className="bg-white border border-dashed border-[#A6B4C0]/30 rounded-2xl p-12 text-center mt-6">
          <p className="font-black">{t("returns.emptyT")}</p>
          <p className="text-sm text-zinc-500">{t("returns.emptyS")}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((r) => (
            <div key={r.id} className="bg-white border border-[#A6B4C0]/15 rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-black">{r.tracking}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {t("returns.by")}: {r.name} • <span dir="ltr">{r.phone}</span> • {new Date(r.createdAt).toISOString().slice(0, 10)}
                  </p>
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#A6B4C0]/30">{label(r.status)}</span>
              </div>
              <p className="text-sm font-bold mt-2">{t("returns.reason")}: <span className="font-normal">{r.reason}</span></p>
              {r.details && <p className="text-xs text-zinc-600 mt-1" dir="auto">{r.details}</p>}
              {r.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setStatus(r.id, "approved")} className="bg-[#137333] text-white px-4 py-1.5 rounded-full text-xs font-black">{t("returns.approve")}</button>
                  <button type="button" onClick={() => setStatus(r.id, "rejected")} className="border border-red-400 text-red-600 px-4 py-1.5 rounded-full text-xs font-black">{t("returns.reject")}</button>
                </div>
              )}
              {r.status === "approved" && (
                <div className="mt-3">
                  <button type="button" onClick={() => setStatus(r.id, "completed")} className="bg-[#121212] text-white px-4 py-1.5 rounded-full text-xs font-black">{t("returns.complete")}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
