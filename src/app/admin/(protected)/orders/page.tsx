"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { useI18n } from "@/i18n/LanguageProvider"
import type { OrderItem } from "@/types"

interface ApiOrder {
  id: string
  tracking?: string
  customerName?: string
  customer?: string
  phone: string
  wilaya?: string
  address?: string
  shipper?: string
  shipmentRef?: string
  items?: OrderItem[] | string
  subtotal?: number
  discount?: number
  promoCode?: string | null
  promo?: string | null
  shipping?: number
  total: number
  status: Order["status"]
  date?: string
  createdAt?: string
}

type Order = {
  id: string
  tracking?: string
  customer: string
  phone: string
  wilaya?: string
  address?: string
  shipper?: string
  shipmentRef?: string
  items?: OrderItem[]
  subtotal?: number
  discount?: number
  promo?: string | null
  shipping?: number
  total: number
  status: "pending" | "shipped" | "delivered" | "cancelled"
  date: string
  createdAt?: string
}

export default function OrdersAdminPage() {
  const { t, d, fp, statusLabel } = useI18n()
  const mock: Order[] = (d.mockOrders as ApiOrder[]).map((o) => ({
    id: o.id,
    tracking: o.tracking,
    customer: o.customer || o.customerName || "",
    phone: o.phone,
    wilaya: o.wilaya,
    address: o.address,
    items: (o.items as OrderItem[]) || [],
    subtotal: o.subtotal,
    discount: o.discount,
    promo: o.promo ?? o.promoCode ?? null,
    shipping: o.shipping,
    total: o.total,
    status: o.status,
    date: o.date || "",
    createdAt: o.createdAt,
  }))
  const [orders, setOrders] = useState<Order[]>([])
  const [selected, setSelected] = useState<Order | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionErr, setActionErr] = useState("")

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/orders?admin=1&limit=50", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const mapped: Order[] = data.orders.map((o: ApiOrder) => ({
          id: o.id,
          tracking: o.tracking,
          customer: o.customerName || o.customer || "",
          phone: o.phone,
          wilaya: o.wilaya,
          address: o.address,
          shipper: o.shipper,
          shipmentRef: o.shipmentRef,
          items: (typeof o.items === "string" ? (JSON.parse(o.items) as OrderItem[]) : o.items) || [],
          subtotal: o.subtotal,
          discount: o.discount,
          promo: o.promoCode || null,
          shipping: o.shipping,
          total: o.total,
          status: o.status,
          date: o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : (o.date || ""),
          createdAt: o.createdAt,
        }))
        setOrders(mapped)
        setLoading(false)
        return
      }
    } catch {}
    const s = localStorage.getItem("z1-orders")
    if (s) {
      try {
        const parsed = JSON.parse(s) as ApiOrder[]
        const normalized: Order[] = parsed.map((o: ApiOrder) => ({
          id: o.id,
          tracking: o.tracking || `TRK-${o.id.slice(-8).toUpperCase()}`,
          customer: o.customer || o.customerName || "",
          phone: o.phone,
          wilaya: o.wilaya,
          address: o.address,
          shipper: o.shipper,
          shipmentRef: o.shipmentRef,
          items: (typeof o.items === "string" ? (JSON.parse(o.items) as OrderItem[]) : o.items) || [],
          subtotal: o.subtotal,
          discount: o.discount,
          promo: o.promo ?? o.promoCode ?? null,
          shipping: o.shipping,
          total: o.total,
          status: o.status || "pending",
          date: o.date || "",
          createdAt: o.createdAt,
        }))
        setOrders(normalized)
      } catch { setOrders(mock) }
    } else {
      setOrders(mock)
    }
    setLoading(false)
  }

  useEffect(() => {
    const t = setTimeout(() => { void fetchOrders() }, 0)
    return () => clearTimeout(t)
    // manual refresh only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copyTracking = (tt: string) => {
    navigator.clipboard?.writeText(tt)
    setCopied(tt)
    setTimeout(() => setCopied(null), 1500)
  }

  const updateStatus = async (id: string, status: Order["status"]) => {
    setActionErr("")
    const prev = orders
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "failed")
      }
      fetchOrders()
    } catch (e: unknown) {
      setOrders(prev)
      const msg = e instanceof Error ? e.message : ""
      setActionErr(msg.includes("INSUFFICIENT_STOCK") ? t("adminOrders.errStock") : "Error")
      setTimeout(() => setActionErr(""), 5000)
      const next = orders.map(o => o.id === id ? { ...o, status } : o)
      setOrders(next)
      localStorage.setItem("z1-orders", JSON.stringify(next))
    }
  }

  const saveShip = async (id: string, shipper: string, shipmentRef: string) => {
    setActionErr("")
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipper, shipmentRef }),
      })
      if (!res.ok) throw new Error("failed")
      setOrders(orders.map(o => o.id === id ? { ...o, shipper, shipmentRef } : o))
    } catch {
      setActionErr("Error")
      setTimeout(() => setActionErr(""), 4000)
    }
  }

  const exportCsv = () => {
    const head = ["id", "tracking", "customer", "phone", "wilaya", "address", "items", "subtotal", "discount", "shipping", "total", "status", "shipper", "shipmentRef", "date"]
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const rows = orders.map(o => [
      o.id, o.tracking || o.id, o.customer, o.phone, o.wilaya || "", o.address || "",
      (o.items || []).map(i => `${i.name} x${i.quantity}`).join(" | "),
      o.subtotal ?? "", o.discount ?? "", o.shipping ?? "", o.total, o.status,
      o.shipper || "", o.shipmentRef || "", o.date,
    ].map(esc).join(","))
    const blob = new Blob([["\ufeff" + head.join(",")].concat(rows).join("\n")], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `flex-supps-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    shipped: "bg-blue-100 text-blue-700 border-blue-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
  }
  const statuses: Order["status"][] = ["pending", "shipped", "delivered", "cancelled"]

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black">{t("adminOrders.title")}</h1>
          <p className="text-sm text-zinc-500">{t("adminOrders.sub")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-[#121212] text-white text-xs px-3 py-1.5 rounded-full font-bold">{orders.length} {t("adminOrders.countUnit")}</span>
          <button type="button" onClick={exportCsv} className="bg-[#E51D25] text-white text-xs px-4 py-1.5 rounded-full font-black">CSV ↓</button>
        </div>
      </div>

      {actionErr && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mt-4">{actionErr}</p>}

      {loading && <div className="bg-white border border-[#A6B4C0]/15 rounded-2xl p-8 text-center mt-6 text-sm">{t("adminOrders.loading")}</div>}
      {!loading && orders.length === 0 && (
        <div className="bg-white border border-dashed border-[#A6B4C0]/30 rounded-2xl p-12 text-center mt-6">
          <p className="font-black">{t("adminOrders.emptyT")}</p>
          <p className="text-sm text-zinc-500">{t("adminOrders.emptyS")}</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {orders.map(o => (
          <div key={o.id} className="bg-white border border-[#A6B4C0]/15 rounded-2xl p-5 hover:shadow-md transition">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-black">{o.id}</p>
                <button type="button" onClick={() => copyTracking(o.tracking || o.id)} className="text-xs font-bold tracking-widest bg-[#FFFFFF] border border-[#A6B4C0]/30 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mt-1 hover:bg-[#E51D25]/20">
                  {t("adminOrders.trackLabel")} {o.tracking || o.id} <span className="text-[10px]">{copied === (o.tracking || o.id) ? "✓" : "⎘"}</span>
                </button>
                <p className="text-sm font-bold mt-2">{o.customer} • <span dir="ltr" className="font-mono">{o.phone}</span></p>
                {o.wilaya && <p className="text-xs text-zinc-500">{o.wilaya} - {o.address}</p>}
                <p className="text-xs text-zinc-400">{o.date}</p>
              </div>
              <div className="text-end">
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${statusColor[o.status]}`}>{statusLabel(o.status)}</span>
                <p className="price text-[#121212] mt-2 text-sm">{fp(o.total)}</p>
                <p className="text-[11px] text-zinc-500">{t("receipt.code")}: <span className="font-mono font-bold">{o.tracking || o.id}</span></p>
              </div>
            </div>

            {o.items && (
              <div className="mt-3 bg-[#FFFFFF]/50 border border-[#A6B4C0]/10 rounded-xl p-3">
                {o.items.map((it: OrderItem, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs py-1 border-b border-[#A6B4C0]/10 last:border-0">
                    <span>{it.name} {it.variantName ? `• ${it.variantName}` : ""} × {it.quantity}</span>
                    <span className="font-bold">{fp(it.price * it.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold mt-2 pt-2 border-t">
                  <span>{t("receipt.grand")}</span><span>{fp(o.total)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              <select value={o.status} onChange={e => updateStatus(o.id, e.target.value as Order["status"])} className="border border-[#A6B4C0]/30 rounded-full px-3 py-2.5 text-xs font-bold bg-white min-h-[44px]">
                {statuses.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
              <button type="button" onClick={() => setSelected(o)} className="bg-[#121212] text-white px-4 py-2.5 rounded-full text-xs font-black min-h-[44px]">{t("adminOrders.receiptT")}</button>
              <a href={`https://wa.me/213${o.phone.replace(/\s/g, "").slice(1)}`} target="_blank" rel="noopener noreferrer" className="bg-[#E51D25] text-white px-4 py-2.5 rounded-full text-xs font-black min-h-[44px] flex items-center">{t("adminOrders.whatsapp")}</a>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3 bg-[#FFFFFF]/60 border border-[#A6B4C0]/15 rounded-xl p-2.5">
              <span className="text-[11px] font-black text-zinc-500">{t("adminOrders.shipper")}</span>
              <select
                value={o.shipper || ""}
                onChange={e => setOrders(orders.map(x => x.id === o.id ? { ...x, shipper: e.target.value } : x))}
                className="border border-[#A6B4C0]/30 rounded-full px-2.5 py-1.5 text-xs font-bold bg-white"
              >
                <option value="">—</option>
                <option value="Yalidine">Yalidine</option>
                <option value="ZR Express">ZR Express</option>
                <option value="EMS">EMS</option>
                <option value="Stock">Stock (retrait)</option>
              </select>
              <input
                value={o.shipmentRef || ""}
                onChange={e => setOrders(orders.map(x => x.id === o.id ? { ...x, shipmentRef: e.target.value } : x))}
                placeholder={t("adminOrders.shipRefPh")}
                dir="ltr"
                className="border border-[#A6B4C0]/30 rounded-full px-3 py-1.5 text-xs font-mono w-40 focus:outline-none focus:border-[#E51D25]"
              />
              <button type="button" onClick={() => saveShip(o.id, o.shipper || "", o.shipmentRef || "")} className="text-xs font-black underline">
                {t("actions.save")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:bg-white" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 print:shadow-none print:border-2 print:border-black" onClick={e => e.stopPropagation()} id="print-receipt">
            <div className="flex items-center justify-between border-b-2 border-[#121212] pb-4">
              <div className="flex items-center gap-3">
                <Image src="/flex-supps-logo.jpg" alt="Flex Supps" width={40} height={40} className="h-10 w-10 rounded-xl border-2 border-[#E51D25]" />
                <div>
                  <p className="font-black text-sm">Flex Supps</p>
                  <p className="text-[11px] text-zinc-500">{t("adminOrders.receiptSub")}</p>
                </div>
              </div>
              <div className="text-end">
                <p className="text-xs text-zinc-500">{t("adminOrders.invoice")}</p>
                <p className="font-mono text-sm font-black">{selected.id}</p>
                <p className="text-xs font-bold tracking-widest bg-[#FFFFFF] border border-[#A6B4C0]/30 px-2 py-0.5 rounded-full inline-block mt-1">{t("adminOrders.trackLabel")} {selected.tracking || selected.id}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="h-8 w-8 rounded-full border flex items-center justify-center print:hidden">✕</button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.customer")}</span><span className="font-bold">{selected.customer}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.phone")}</span><span dir="ltr" className="font-mono">{selected.phone}</span></div>
              {selected.wilaya && <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.address")}</span><span className="text-end max-w-[60%]">{selected.wilaya} - {selected.address}</span></div>}
              <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.date")}</span><span className="font-bold">{selected.date}</span></div>
              <div className="flex justify-between items-center"><span className="text-zinc-500">{t("receipt.status")}</span><span className={`px-3 py-1 rounded-full text-xs font-black border ${statusColor[selected.status]}`}>{statusLabel(selected.status)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.code")}</span><span className="font-mono font-black tracking-widest">{selected.tracking || selected.id}</span></div>
            </div>

            {selected.items && (
              <div className="mt-4 border-t-2 border-dashed pt-4">
                <p className="text-xs font-black mb-2">{t("receipt.details")}</p>
                {selected.items.map((it: OrderItem, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-zinc-100 last:border-0">
                    <span className="flex-1">{it.name} {it.variantName ? `• ${it.variantName}` : ""} × {it.quantity}</span><span className="font-bold">{fp(it.price * it.quantity)}</span>
                  </div>
                ))}
                {selected.subtotal !== undefined && (
                  <div className="space-y-1 mt-3 text-sm border-t pt-3">
                    <div className="flex justify-between"><span>{t("receipt.subtotal")}</span><span>{fp(selected.subtotal || selected.total)}</span></div>
                    {selected.discount ? <div className="flex justify-between text-emerald-600"><span>{t("receipt.discount")} {selected.promo}</span><span>-{fp(selected.discount)}</span></div> : null}
                    {selected.shipping !== undefined && <div className="flex justify-between"><span>{t("receipt.shipping")}</span><span>{selected.shipping === 0 ? t("receipt.free") : fp(selected.shipping)}</span></div>}
                  </div>
                )}
                <div className="flex justify-between font-black text-base border-t-2 border-[#121212] pt-3 mt-3">
                  <span>{t("receipt.grand")}</span><span className="text-[#E51D25]">{fp(selected.total)}</span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-zinc-400 text-center mt-4 border-t pt-3">{t("receipt.thanks")}</p>

            <div className="mt-6 flex gap-2 print:hidden">
              <button type="button" onClick={() => window.print()} className="flex-1 bg-[#121212] text-white py-2.5 rounded-xl text-sm font-bold">{t("receipt.print")}</button>
              <button type="button" onClick={() => setSelected(null)} className="flex-1 border border-[#A6B4C0]/30 py-2.5 rounded-xl text-sm font-bold">{t("receipt.close")}</button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-400 text-center mt-8">{t("adminOrders.footerNote")}</p>
    </div>
  )
}
