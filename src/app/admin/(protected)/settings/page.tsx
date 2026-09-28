"use client"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"

export default function AdminSettings() {
  const { t } = useI18n()
  const [form, setForm] = useState({ shipping_threshold: "10000", shipping_fee: "500", cod_enabled: true, loyalty_enabled: true })
  const [msg, setMsg] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/settings", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d?.settings) return
          setForm({
            shipping_threshold: d.settings.shipping_threshold ?? "10000",
            shipping_fee: d.settings.shipping_fee ?? "500",
            cod_enabled: d.settings.cod_enabled !== "0",
            loyalty_enabled: d.settings.loyalty_enabled !== "0",
          })
        })
        .catch(() => {})
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg("")
    try {
      const entries: [string, string][] = [
        ["shipping_threshold", form.shipping_threshold],
        ["shipping_fee", form.shipping_fee],
        ["cod_enabled", form.cod_enabled ? "1" : "0"],
        ["loyalty_enabled", form.loyalty_enabled ? "1" : "0"],
      ]
      for (const [key, value] of entries) {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        })
      }
      setMsg(t("settingsA.saved"))
    } catch {
      setMsg("Error")
    }
    setTimeout(() => setMsg(""), 4000)
  }

  return (
    <div>
      <h1 className="text-xl font-black">{t("settingsA.title")}</h1>
      <p className="text-sm text-zinc-500">{t("settingsA.sub")}</p>

      <form onSubmit={save} className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5 mt-4 space-y-4 max-w-xl">
        <div>
          <label className="text-xs font-black">{t("settingsA.shipThreshold")}</label>
          <input type="number" min={0} value={form.shipping_threshold} onChange={(e) => setForm({ ...form, shipping_threshold: e.target.value })} className="w-full mt-1 border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm" required />
        </div>
        <div>
          <label className="text-xs font-black">{t("settingsA.shipFee")}</label>
          <input type="number" min={0} value={form.shipping_fee} onChange={(e) => setForm({ ...form, shipping_fee: e.target.value })} className="w-full mt-1 border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm" required />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={form.cod_enabled} onChange={(e) => setForm({ ...form, cod_enabled: e.target.checked })} className="h-5 w-5 accent-[#E51D25]" />
          {t("settingsA.codOn")}
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={form.loyalty_enabled} onChange={(e) => setForm({ ...form, loyalty_enabled: e.target.checked })} className="h-5 w-5 accent-[#E51D25]" />
          {t("settingsA.loyaltyOn")}
        </label>
        {msg && <p className="text-sm font-bold text-emerald-600">{msg}</p>}
        <button type="submit" className="bg-[#121212] text-white px-8 py-3 rounded-full text-sm font-black">{t("settingsA.save")}</button>
      </form>
    </div>
  )
}
