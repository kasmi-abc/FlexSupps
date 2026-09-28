"use client"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"
import type { Product } from "@/types"

type Batch = {
  id: string
  lot: string
  expiry: string
  qty: number
  note?: string | null
  variant: { name: string; sku: string; product: { name: string } }
}

type Expiring = {
  id: string
  lot: string
  expiry: string
  qty: number
  daysLeft: number
  variant: string
  sku: string
  product: string
}

type Low = { id: string; name: string; sku: string; stock: number; product: string }

export default function AdminStock() {
  const { t } = useI18n()
  const [batches, setBatches] = useState<Batch[]>([])
  const [expiring, setExpiring] = useState<Expiring[]>([])
  const [low, setLow] = useState<Low[]>([])
  const [variants, setVariants] = useState<{ id: string; label: string }[]>([])
  const [form, setForm] = useState({ variantId: "", lot: "", expiry: "", qty: "", note: "" })
  const [msg, setMsg] = useState("")

  const load = async () => {
    try {
      const [bRes, aRes, pRes] = await Promise.all([
        fetch("/api/stock/batches", { cache: "no-store" }),
        fetch("/api/stock/alerts", { cache: "no-store" }),
        fetch("/api/products?limit=50", { cache: "no-store" }),
      ])
      if (bRes.ok) setBatches(((await bRes.json()).batches || []) as Batch[])
      if (aRes.ok) {
        const d = await aRes.json()
        setExpiring(d.expiring || [])
        setLow(d.lowStock || [])
      }
      if (pRes.ok) {
        const d = await pRes.json()
        const vs: { id: string; label: string }[] = []
        for (const p of (d.products || []) as Product[]) {
          for (const v of p.variants) vs.push({ id: v.id, label: `${p.name} — ${v.name} (${v.stock})` })
        }
        setVariants(vs)
      }
    } catch {}
  }

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg("")
    try {
      const res = await fetch("/api/stock/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: form.variantId,
          lot: form.lot,
          expiry: form.expiry,
          qty: Number(form.qty) || 0,
          note: form.note,
        }),
      })
      if (!res.ok) { setMsg("Error"); return }
      setForm({ variantId: "", lot: "", expiry: "", qty: "", note: "" })
      load()
    } catch {
      setMsg("Error")
    }
  }

  const del = async (id: string) => {
    if (!confirm(t("stockA.delete") + " ?")) return
    try {
      await fetch(`/api/stock/batches?id=${id}`, { method: "DELETE" })
      load()
    } catch {}
  }

  const fmtDate = (iso: string) => new Date(iso).toISOString().slice(0, 10)

  return (
    <div>
      <h1 className="text-xl font-black">{t("stockA.title")}</h1>
      <p className="text-sm text-zinc-500">{t("stockA.sub")}</p>

      {(expiring.length > 0 || low.length > 0) && (
        <div className="mt-4 space-y-3">
          {expiring.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm font-black text-red-700">{t("stockA.expiringT")} ({expiring.length})</p>
              <div className="mt-2 space-y-1">
                {expiring.map((b) => (
                  <p key={b.id} className="text-xs text-red-700">
                    <span className="font-black">{b.daysLeft <= 0 ? t("stockA.expired") : `${b.daysLeft} ${t("stockA.daysLeft")}`}</span>
                    {" "}• {b.product} — {b.variant} • {t("stockA.lot")}: {b.lot} • {fmtDate(b.expiry)} • {t("stockA.qty")}: {b.qty}
                  </p>
                ))}
              </div>
            </div>
          )}
          {low.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm font-black text-amber-700">{t("stockA.lowT")} ({low.length})</p>
              <div className="mt-2 space-y-1">
                {low.map((v) => (
                  <p key={v.id} className="text-xs text-amber-700">{v.product} — {v.name} ({v.sku}): {v.stock}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={add} className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5 mt-4 grid md:grid-cols-2 gap-3">
        <select value={form.variantId} onChange={(e) => setForm({ ...form, variantId: e.target.value })} className="md:col-span-2 border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm bg-white" required>
          <option value="">{t("stockA.variantSel")}</option>
          {variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
        <input placeholder={t("stockA.lotPh")} value={form.lot} onChange={(e) => setForm({ ...form, lot: e.target.value })} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm" required />
        <input type="date" aria-label={t("stockA.expiryPh")} value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm" required />
        <input placeholder={t("stockA.qtyPh")} type="number" min={0} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm" required />
        <input placeholder={t("stockA.notePh")} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm" />
        {msg && <p className="md:col-span-2 text-sm text-red-600">{msg}</p>}
        <button type="submit" className="md:col-span-2 bg-[#121212] text-white py-3 rounded-xl font-black">{t("stockA.save")}</button>
      </form>

      <h2 className="font-black mt-6">{t("stockA.batchesT")} ({batches.length})</h2>
      {batches.length === 0 ? (
        <p className="text-sm text-zinc-500 mt-2">{t("stockA.emptyB")}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {batches.map((b) => (
            <div key={b.id} className="bg-white border border-[#A6B4C0]/15 rounded-2xl p-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="font-black">{b.variant.product.name}</span>
              <span>{b.variant.name} ({b.variant.sku})</span>
              <span className="font-mono font-bold">{b.lot}</span>
              <span>{fmtDate(b.expiry)}</span>
              <span className="font-black">×{b.qty}</span>
              {b.note && <span className="text-zinc-500">{b.note}</span>}
              <button type="button" onClick={() => del(b.id)} className="ms-auto text-xs text-red-600 underline">{t("stockA.delete")}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
