"use client"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"

type Msg = { id: string; name: string; phone: string; subject: string; message: string; read: boolean; createdAt: string }

export default function AdminMessages() {
  const { t } = useI18n()
  const [list, setList] = useState<Msg[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/contact", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setList(data.messages || [])
        setUnread(data.unread || 0)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [])

  const markRead = async () => {
    try {
      await fetch("/api/contact", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) })
      load()
    } catch {}
  }

  const del = async (id: string) => {
    if (!confirm(t("messages.delete") + " ?")) return
    try {
      await fetch(`/api/contact?id=${id}`, { method: "DELETE" })
      load()
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">{t("messages.title")} {unread > 0 && <span className="bg-[#E51D25] text-white text-xs px-2 py-0.5 rounded-full">{unread} {t("messages.unread")}</span>}</h1>
          <p className="text-sm text-zinc-500">{t("messages.sub")}</p>
        </div>
        <button type="button" onClick={markRead} className="text-xs font-bold underline text-zinc-500">{t("messages.markRead")}</button>
      </div>

      {loading ? (
        <p className="text-sm text-center py-8">...</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-zinc-500 mt-4">{t("messages.empty")}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {list.map((m) => (
            <div key={m.id} className={`border rounded-2xl p-4 ${m.read ? "bg-white border-[#A6B4C0]/15" : "bg-[#E51D25]/5 border-[#E51D25]/40"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black text-sm">{m.name} <span dir="ltr" className="font-mono font-normal text-zinc-500 text-xs">{m.phone}</span></p>
                {m.subject && <span className="text-[11px] bg-[#FFFFFF] border border-[#A6B4C0]/30 px-2 py-0.5 rounded-full">{m.subject}</span>}
                <span className="text-[11px] text-zinc-400 ms-auto">{new Date(m.createdAt).toISOString().slice(0, 16).replace("T", " ")}</span>
              </div>
              <p className="text-sm text-zinc-700 mt-2" dir="auto">{m.message}</p>
              <div className="flex gap-2 mt-3">
                <a href={`https://wa.me/213${m.phone.replace(/\s/g, "").slice(1)}?text=${encodeURIComponent(m.name)}`} target="_blank" rel="noopener noreferrer" className="bg-[#137333] text-white px-4 py-1.5 rounded-full text-xs font-black">{t("messages.replyWa")}</a>
                <button type="button" onClick={() => del(m.id)} className="text-xs text-red-600 underline">{t("messages.delete")}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
