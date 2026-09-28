"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useI18n } from "@/i18n/LanguageProvider"
import type { OrderItem } from "@/types"

type Order = {
  id: string
  tracking?: string
  customer: string
  phone: string
  wilaya?: string
  address?: string
  items?: OrderItem[]
  subtotal?: number
  discount?: number
  promo?: string | null
  shipping?: number
  total: number
  status: "pending" | "shipped" | "delivered" | "cancelled"
  date: string
}

export default function OrdersPage() {
  const { t, fp, statusLabel } = useI18n()
  const [code, setCode] = useState("")
  const [result, setResult] = useState<Order | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const [loading, setLoading] = useState(false)
  const [erasing, setErasing] = useState(false)
  const [retReason, setRetReason] = useState("")
  const [retDetails, setRetDetails] = useState("")
  const [retMsg, setRetMsg] = useState("")
  const [retSending, setRetSending] = useState(false)
  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(""); setResult(null)
    const q = code.trim().toUpperCase()
    if (!q) { setError(t("ordersPage.errEmpty")); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/orders?tracking=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        const o = data.order
        const mapped: Order = {
          id: o.id,
          tracking: o.tracking,
          customer: o.customerName,
          phone: o.phone,
          wilaya: o.wilaya,
          address: o.address,
          items: JSON.parse(typeof o.items === "string" ? o.items : JSON.stringify(o.items)),
          subtotal: o.subtotal,
          discount: o.discount,
          promo: o.promoCode,
          shipping: o.shipping,
          total: o.total,
          status: o.status,
          date: new Date(o.createdAt).toISOString().slice(0, 10),
        }
        setResult(mapped)
        setLoading(false)
        return
      }
    } catch {}
    try {
      const raw = localStorage.getItem("z1-orders")
      const orders: Order[] = raw ? JSON.parse(raw) : []
      const found = orders.find(o => (o.tracking || o.id).toUpperCase() === q || o.id.toUpperCase() === q)
      if (!found) setError(t("ordersPage.errNotFound"))
      else setResult(found)
    } catch { setError(t("ordersPage.errRead")) }
    finally { setLoading(false) }
  }

  const sendReturn = async () => {
    if (!result?.tracking || !retReason.trim()) return
    setRetSending(true)
    setRetMsg("")
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking: result.tracking,
          name: result.customer,
          phone: result.phone,
          reason: retReason.trim(),
          details: retDetails.trim(),
        }),
      })
      if (res.ok) {
        setRetMsg(t("ordersPage.retOk"))
        setRetReason("")
        setRetDetails("")
      } else {
        setRetMsg(t("ordersPage.errRead"))
      }
    } catch {
      setRetMsg(t("ordersPage.errRead"))
    } finally {
      setRetSending(false)
    }
  }

  const copyTracking = () => {
    if (!result) return
    navigator.clipboard?.writeText(result.tracking || result.id)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const eraseData = async () => {
    if (!result?.tracking) return
    if (!confirm(t("ordersPage.eraseConfirm"))) return
    setErasing(true)
    try {
      const res = await fetch("/api/privacy/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking: result.tracking }),
      })
      if (res.ok) {
        setResult({ ...result, customer: "—", phone: "—", wilaya: "", address: "" })
        setError(t("ordersPage.eraseOk"))
      } else {
        setError(t("ordersPage.errRead"))
      }
    } catch {
      setError(t("ordersPage.errRead"))
    } finally {
      setErasing(false)
    }
  }
  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    shipped: "bg-blue-100 text-blue-700 border-blue-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-black">{t("ordersPage.title")}</h1>
      <p className="text-sm text-zinc-500 mt-1">{t("ordersPage.privacy")}</p>

      <form onSubmit={handleTrack} className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-6 mt-6">
        <label className="text-xs font-black">{t("ordersPage.codeLabel")}</label>
        <div className="flex gap-2 mt-2">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="TRK-12345678" className="flex-1 border border-[#A6B4C0]/30 rounded-full px-4 py-3 text-sm font-mono tracking-widest focus:outline-none focus:border-[#E51D25]" required />
          <button type="submit" disabled={loading} className="bg-[#121212] text-white px-6 py-3 rounded-full text-sm font-black disabled:opacity-60">{loading ? "..." : t("ordersPage.trackBtn")}</button>
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">{t("ordersPage.hint")}</p>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mt-3">{error}</p>}
      </form>

      {result && (
        <div className="bg-white border-2 border-[#121212] rounded-2xl p-6 mt-6" id="print-receipt">
          <div className="flex items-center justify-between border-b-2 border-[#121212] pb-3">
            <div className="flex items-center gap-2">
              <Image src="/flex-supps-logo.jpg" alt="Flex Supps" width={36} height={36} className="h-9 w-9 rounded-xl border-2 border-[#E51D25]" />
              <div>
                <p className="font-black text-sm">Flex Supps</p>
                <p className="text-[11px] text-zinc-500">{t("receipt.receipt")} • {statusLabel(result.status)}</p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-xs text-zinc-500">{t("receipt.invoice")}</p>
              <p className="font-mono text-sm font-black">{result.id}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.code")}</span><button type="button" onClick={copyTracking} className="font-mono font-black tracking-widest bg-[#FFFFFF] border border-[#A6B4C0]/30 px-2 py-1 rounded-full text-xs flex items-center gap-1">{result.tracking || result.id} <span className="text-[10px]">{copied ? "✓" : "⎘"}</span></button></div>
            <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.status")}</span><span className={`px-2 py-1 rounded-full text-xs font-black border ${statusColor[result.status]}`}>{statusLabel(result.status)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.customer")}</span><span className="font-bold">{result.customer}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.date")}</span><span>{result.date}</span></div>
            {result.wilaya && <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.wilaya")}</span><span className="text-end max-w-[60%]">{result.wilaya} - {result.address}</span></div>}
          </div>

          {result.items && (
            <div className="mt-4 border-t-2 border-dashed pt-4">
              {result.items.map((it: OrderItem, idx: number) => (
                <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-zinc-100 last:border-0">
                  <span>{it.name} {it.variantName ? `• ${it.variantName}` : ""} × {it.quantity}</span><span className="font-bold">{fp(it.price * it.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-base border-t-2 border-[#121212] pt-3 mt-3"><span>{t("receipt.grand")}</span><span className="text-[#E51D25]">{fp(result.total)}</span></div>
            </div>
          )}

          <div className="mt-6 flex gap-2 print:hidden">
            <button type="button" onClick={() => window.print()} className="flex-1 bg-[#121212] text-white py-2.5 rounded-xl text-sm font-bold">{t("receipt.print")}</button>
            <button type="button" onClick={() => setResult(null)} className="flex-1 border border-[#A6B4C0]/30 py-2.5 rounded-xl text-sm font-bold">{t("receipt.newSearch")}</button>
          </div>
          <div className="mt-4 border-t border-dashed pt-4 print:hidden">
            <p className="font-black text-xs">{t("ordersPage.retT")}</p>
            <div className="flex gap-2 mt-2">
              <input
                value={retReason}
                onChange={(e) => setRetReason(e.target.value)}
                placeholder={t("ordersPage.retReasonPh")}
                maxLength={200}
                className="flex-1 border border-[#A6B4C0]/30 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#E51D25]"
              />
              <button type="button" onClick={sendReturn} disabled={retSending || !retReason.trim()} className="bg-[#121212] text-white px-4 py-2 rounded-full text-xs font-black disabled:opacity-50">
                {retSending ? "..." : t("ordersPage.retSend")}
              </button>
            </div>
            <input
              value={retDetails}
              onChange={(e) => setRetDetails(e.target.value)}
              placeholder={t("ordersPage.retDetailsPh")}
              maxLength={1000}
              className="w-full mt-2 border border-[#A6B4C0]/30 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#E51D25]"
            />
            {retMsg && <p className="text-xs font-bold text-emerald-600 mt-2">{retMsg}</p>}
          </div>
          <div className="mt-4 border-t border-dashed pt-4 print:hidden">
            <p className="font-black text-xs">{t("ordersPage.eraseT")}</p>
            <p className="text-[11px] text-zinc-500 mt-1">{t("ordersPage.eraseS")}</p>
            <button type="button" onClick={eraseData} disabled={erasing} className="mt-2 text-xs font-bold text-red-600 underline disabled:opacity-50">
              {erasing ? "..." : t("ordersPage.eraseBtn")}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 bg-[#FFFFFF] border border-[#A6B4C0]/20 rounded-2xl p-5 text-xs">
        <p className="font-black">{t("ordersPage.helpT")}</p>
        <p className="text-zinc-600 mt-1">{t("ordersPage.helpS")}</p>
        <Link href="/products" className="inline-block mt-3 bg-white border border-[#A6B4C0] px-4 py-2 rounded-full font-black">{t("actions.shopNow")}</Link>
      </div>
    </div>
  )
}
