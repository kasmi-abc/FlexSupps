"use client"
import { useState, useEffect } from "react"
import { useI18n } from "@/i18n/LanguageProvider"
import type { ApiPromo } from "@/types"

type Promo = { id: string; code: string; discount: number; expiry: string; active: boolean; uses: number }

const LS_KEY = "z1-promos"
const initial: Promo[] = [
  { id: "1", code: "FIT10", discount: 10, expiry: "2026-12-31", active: true, uses: 124 },
  { id: "2", code: "RAMADAN15", discount: 15, expiry: "2026-03-15", active: false, uses: 89 },
]

export default function PromosPage() {
  const { t } = useI18n()
  const [promos, setPromos] = useState<Promo[]>([])
  const [form, setForm] = useState({ code: "", discount: "", expiry: "" })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState("")

  const fetchPromos = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/promos?admin=1", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const mapped: Promo[] = data.promos.map((p: ApiPromo) => ({
          id: p.id,
          code: p.code,
          discount: p.discount,
          expiry: new Date(p.expiry).toISOString().slice(0, 10),
          active: p.active,
          uses: p.uses,
        }))
        setPromos(mapped)
        setLoading(false)
        return
      }
    } catch {}
    const s = localStorage.getItem(LS_KEY)
    setPromos(s ? JSON.parse(s) : initial)
    setLoading(false)
  }

  useEffect(() => {
    const t = setTimeout(() => { void fetchPromos() }, 0)
    return () => clearTimeout(t)
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg("")
    try {
      const res = await fetch("/api/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.code.toUpperCase(), discount: Number(form.discount), expiry: form.expiry }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error || t("adminPromos.errAdd")); return }
      setForm({ code: "", discount: "", expiry: "" })
      setShow(false)
      fetchPromos()
    } catch {
      const p: Promo = { id: Date.now().toString(), code: form.code.toUpperCase(), discount: Number(form.discount), expiry: form.expiry, active: true, uses: 0 }
      const next = [p, ...promos]
      setPromos(next)
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      setForm({ code: "", discount: "", expiry: "" })
      setShow(false)
    }
  }

  const toggle = async (code: string, current: boolean) => {
    try {
      const res = await fetch(`/api/promos/${code}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !current }) })
      if (res.ok) fetchPromos()
      else {
        const next = promos.map(p => p.code === code ? { ...p, active: !p.active } : p)
        setPromos(next)
        localStorage.setItem(LS_KEY, JSON.stringify(next))
      }
    } catch {
      const next = promos.map(p => p.code === code ? { ...p, active: !p.active } : p)
      setPromos(next)
      localStorage.setItem(LS_KEY, JSON.stringify(next))
    }
  }
  const del = async (code: string) => {
    if (!confirm(t("adminPromos.confirmDelete"))) return
    try {
      const res = await fetch(`/api/promos/${code}`, { method: "DELETE" })
      if (res.ok) fetchPromos()
      else {
        const next = promos.filter(p => p.code !== code)
        setPromos(next)
        localStorage.setItem(LS_KEY, JSON.stringify(next))
      }
    } catch {
      const next = promos.filter(p => p.code !== code)
      setPromos(next)
      localStorage.setItem(LS_KEY, JSON.stringify(next))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">{t("adminPromos.title")}</h1>
          <p className="text-sm text-zinc-500">{t("adminPromos.sub")}</p>
        </div>
        <button type="button" onClick={() => setShow(!show)} className="bg-[#E51D25] text-white px-5 py-2 rounded-full text-sm font-black">{show ? t("adminPromos.cancel") : t("adminPromos.add")}</button>
      </div>

      {show && (
        <form onSubmit={handleAdd} className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5 mt-4 grid md:grid-cols-3 gap-3">
          <input placeholder={t("adminPromos.codePh")} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm" required />
          <input placeholder={t("adminPromos.discountPh")} type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm" required />
          <input type="date" aria-label={t("adminPromos.expiryPh")} value={form.expiry} onChange={e => setForm({ ...form, expiry: e.target.value })} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm" required />
          <button type="submit" className="md:col-span-3 bg-[#121212] text-white py-3 rounded-xl font-black">{t("adminPromos.save")}</button>
        </form>
      )}

      {loading ? <p className="text-sm text-center mt-6">{t("adminPromos.loading")}</p> : (
        <div className="mt-6 grid gap-3">
          {promos.map(p => (
            <div key={p.id} className="bg-white border border-[#A6B4C0]/15 rounded-2xl p-4 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black ${p.active ? "bg-[#E51D25] text-white" : "bg-zinc-100 text-zinc-400"}`}>{p.discount}%</div>
              <div className="flex-1">
                <p className="font-black tracking-widest">{p.code} {p.active ? <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{t("adminPromos.active")}</span> : <span className="bg-zinc-200 text-zinc-600 text-[10px] px-1.5 py-0.5 rounded-full">{t("adminPromos.paused")}</span>}</p>
                <p className="text-xs text-zinc-500">{t("adminPromos.expires")} {p.expiry} • {t("adminPromos.used")} {p.uses}x</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => toggle(p.code, p.active)} className="text-xs font-bold border border-[#A6B4C0]/30 px-3 py-1.5 rounded-full hover:bg-[#FFFFFF]">{p.active ? t("adminPromos.pause") : t("adminPromos.activate")}</button>
                <button type="button" onClick={() => del(p.code)} className="text-xs text-red-600 underline">{t("adminPromos.delete")}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {msg && <p className="text-sm text-red-600 mt-3">{msg}</p>}

      <div className="mt-6 bg-[#121212] text-white rounded-2xl p-5">
        <p className="font-black text-sm">{t("adminPromos.howT")}</p>
        <p className="text-xs text-white/60 mt-1">{t("adminPromos.howS")}</p>
      </div>
    </div>
  )
}
