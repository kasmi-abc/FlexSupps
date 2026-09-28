"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useEffect } from "react"
import { useCartStore } from "@/store/cart"
import { useI18n } from "@/i18n/LanguageProvider"
import { useSettings, getSessionId } from "@/hooks/useSettings"
import type { OrderItem } from "@/types"

interface DisplayOrder {
  id: string
  tracking: string
  customer: string
  phone: string
  wilaya: string
  address: string
  items: OrderItem[]
  subtotal: number
  discount: number
  promo: string | null
  shipping: number
  total: number
  status: "pending" | "shipped" | "delivered" | "cancelled"
  date: string
  createdAt: string
}

export default function CheckoutPage() {
  const { t, fp, d, statusLabel } = useI18n()
  const { items, total, clearCart } = useCartStore()
  const settings = useSettings()
  const tt = total()
  const shipping = tt >= settings.shipping_threshold ? 0 : settings.shipping_fee
  const [promo, setPromo] = useState("")
  const [discount, setDiscount] = useState(0)
  const [promoMsg, setPromoMsg] = useState("")
  const promoDiscount = Math.round(tt * (discount / 100))
  const grand = tt - promoDiscount + shipping
  const [done, setDone] = useState(false)
  const [lastOrder, setLastOrder] = useState<DisplayOrder | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", wilaya: "", address: "" })

  const [promoLoading, setPromoLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // checkout-start beacon
  useEffect(() => {
    if (items.length === 0) return
    const t = setTimeout(() => {
      fetch("/api/abandoned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          phone: form.phone || "",
          items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
          total: tt,
        }),
      }).catch(() => {})
    }, 3000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyPromo = async () => {
    const code = promo.trim().toUpperCase()
    if (!code) return
    setPromoLoading(true)
    setPromoMsg("")
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: tt }),
      })
      const data = await res.json()
      if (data.valid) {
        setDiscount(data.promo.discount)
        setPromoMsg(`${t("checkout.applied")} ${data.promo.discount}% ${t("checkout.off")} • ${t("checkout.youSave")} ${fp(Math.round(tt * (data.promo.discount / 100)))}`)
      } else {
        setDiscount(0)
        setPromoMsg(data.error || t("checkout.promoBad"))
      }
    } catch {
      try {
        const saved = localStorage.getItem("z1-promos")
        const list = saved ? JSON.parse(saved) as { code: string; discount: number; active: boolean }[] : [{ code: "FIT10", discount: 10, active: true }]
        const found = list.find((p) => p.code === code && p.active)
        if (found) {
          setDiscount(found.discount)
          setPromoMsg(`${t("checkout.applied")} ${found.discount}% ${t("checkout.off")}`)
        } else {
          setDiscount(0)
          setPromoMsg(t("checkout.promoBad"))
        }
      } catch {
        if (code === "FIT10") { setDiscount(10); setPromoMsg(`${t("checkout.applied")} 10% ${t("checkout.off")}`) }
        else { setDiscount(0); setPromoMsg(t("checkout.promoBad")) }
      }
    } finally {
      setPromoLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitLoading(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          phone: form.phone,
          wilaya: form.wilaya,
          address: form.address,
          items: items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            variantName: i.variantName,
            image: i.image,
            price: i.price,
            quantity: i.quantity,
            isSubscription: i.isSubscription,
          })),
          promoCode: promo.trim() ? promo.trim().toUpperCase() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || t("checkout.errCreate"))
        setSubmitLoading(false)
        return
      }
      const order = data.order
      const display = {
        id: order.id,
        tracking: order.tracking,
        customer: order.customerName,
        phone: order.phone,
        wilaya: order.wilaya,
        address: order.address,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        promo: order.promoCode,
        shipping: order.shipping,
        total: order.total,
        status: order.status,
        date: new Date(order.createdAt).toISOString().slice(0, 10),
        createdAt: order.createdAt,
      }
      try {
        const raw = localStorage.getItem("z1-orders")
        const orders = raw ? JSON.parse(raw) : []
        orders.unshift(display)
        localStorage.setItem("z1-orders", JSON.stringify(orders))
        localStorage.setItem("z1-last-order", JSON.stringify(display))
      } catch {}
      setLastOrder(display)
      setDone(true)
      clearCart()
      fetch("/api/abandoned", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), ordered: true }),
      }).catch(() => {})
    } catch {
      setSubmitError(t("checkout.errConn"))
    } finally {
      setSubmitLoading(false)
    }
  }

  if (done && lastOrder) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl">✓</div>
          <h1 className="text-2xl font-black mt-4">{t("checkout.successT")}</h1>
          <p className="text-sm text-zinc-600 mt-2">{t("checkout.successThanks")} {form.name} {t("checkout.successCall")} <span dir="ltr">{form.phone}</span> {t("checkout.successConfirm")}</p>
          <div className="inline-flex items-center gap-2 mt-3 bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-black">{t("receipt.status")}: {statusLabel(lastOrder.status)}</div>
        </div>

        <div className="bg-white border-2 border-[#121212] rounded-2xl p-6 mt-6 print:border-black">
          <div className="flex items-center justify-between border-b-2 border-[#121212] pb-3">
            <div className="flex items-center gap-2">
              <Image src="/flex-supps-logo.jpg" alt="Flex Supps" width={40} height={40} className="h-10 w-10 rounded-xl border-2 border-[#E51D25]" />
              <div>
                <p className="font-black text-sm">Flex Supps</p>
                <p className="text-[11px] text-zinc-500">{t("receipt.receipt")}</p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-xs text-zinc-500">{t("receipt.invoice")}</p>
              <p className="font-mono text-sm font-black">{lastOrder.id}</p>
              <span className="inline-block mt-1 bg-[#FFFFFF] border border-[#A6B4C0]/30 px-2 py-0.5 rounded-full text-xs font-bold tracking-widest">{t("receipt.code")}: {lastOrder.tracking}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.code")}</span><span className="font-mono font-black tracking-widest bg-[#121212] text-white px-2 py-1 rounded-full text-xs">{lastOrder.tracking}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.status")}</span><span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-full text-xs font-black">{statusLabel(lastOrder.status)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.customer")}</span><span className="font-bold">{lastOrder.customer} • <span dir="ltr">{lastOrder.phone}</span></span></div>
            <div className="flex justify-between"><span className="text-zinc-500">{t("receipt.wilaya")}</span><span className="text-end max-w-[60%]">{lastOrder.wilaya} • {lastOrder.address}</span></div>
            <div className="border-t-2 border-dashed pt-3 mt-3 space-y-1">
              {lastOrder.items.map((it: OrderItem) => (
                <div key={`${it.variantId}-${it.isSubscription}`} className="flex justify-between text-xs py-1 border-b border-zinc-100 last:border-0">
                  <span>{it.name} {it.variantName ? `• ${it.variantName}` : ""} × {it.quantity}</span><span className="font-bold">{fp(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between"><span>{t("receipt.subtotal")}</span><span>{fp(lastOrder.subtotal)}</span></div>
              {lastOrder.discount > 0 && <div className="flex justify-between text-emerald-600"><span>{t("receipt.discount")} {lastOrder.promo}</span><span>-{fp(lastOrder.discount)}</span></div>}
              <div className="flex justify-between"><span>{t("receipt.shipping")}</span><span>{lastOrder.shipping === 0 ? t("receipt.free") : fp(lastOrder.shipping)}</span></div>
              <div className="flex justify-between font-black text-base border-t-2 border-[#121212] pt-2"><span>{t("receipt.grand")}</span><span className="text-[#E51D25]">{fp(lastOrder.total)}</span></div>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 text-center mt-4 border-t pt-3">{t("receipt.keepCode")}</p>
          <div className="mt-4 flex gap-2 print:hidden">
            <button type="button" onClick={() => window.print()} className="flex-1 bg-[#121212] text-white py-2.5 rounded-xl text-sm font-bold">{t("receipt.print")}</button>
            <Link href="/orders" className="flex-1 text-center border-2 border-[#121212] py-2.5 rounded-xl text-sm font-black">{t("receipt.trackOrders")}</Link>
          </div>
          <div className="mt-2 flex gap-2 print:hidden">
            <Link href="/products" className="flex-1 text-center bg-[#E51D25] text-white py-2.5 rounded-xl text-sm font-black">{t("receipt.continueShopping")}</Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-black">{t("checkout.emptyT")}</p>
        <Link href="/products" className="inline-block mt-4 bg-black text-white px-6 py-2 rounded-full">{t("actions.shopNow")}</Link>
      </div>
    )
  }

  if (!settings.cod_enabled) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-black">{t("checkout.codOffT")}</p>
        <p className="text-sm text-zinc-500 mt-2">{t("checkout.codOffS")}</p>
        <Link href="/products" className="inline-block mt-4 bg-black text-white px-6 py-2 rounded-full">{t("actions.shopNow")}</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-black">{t("checkout.title")}</h1>
      <p className="text-sm text-zinc-500">{t("checkout.sub")}</p>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px] gap-8 mt-6">
        <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-6 space-y-4">
          <h3 className="font-black">{t("checkout.deliveryInfo")}</h3>
          <input placeholder={t("checkout.namePh")} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={80} minLength={2} aria-label={t("checkout.namePh")} className="w-full border border-[#A6B4C0]/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E51D25]" required />
          <input placeholder={t("checkout.phonePh")} dir="ltr" type="tel" inputMode="numeric" pattern="0(5|6|7)[0-9]{8}" maxLength={10} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, "") })} onBlur={() => {
            if (form.phone.length >= 10 && items.length > 0) {
              fetch("/api/abandoned", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId: getSessionId(),
                  phone: form.phone,
                  items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
                  total: tt,
                }),
              }).catch(() => {})
            }
          }} aria-label={t("checkout.phonePh")} className="w-full border border-[#A6B4C0]/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E51D25] text-start" required />
          <select value={form.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })} className="w-full border border-[#A6B4C0]/30 rounded-xl px-4 py-3 text-sm bg-white" required>
            <option value="">{t("checkout.wilayaPrompt")}</option>
            {d.wilayas.map(w => <option key={w}>{w}</option>)}
          </select>
          <textarea placeholder={t("checkout.addressPh")} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} maxLength={200} aria-label={t("checkout.addressPh")} className="w-full border border-[#A6B4C0]/30 rounded-xl px-4 py-3 text-sm" rows={3} required />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" required /> {t("checkout.agree")}{" "}
            <Link href="/terms" className="underline hover:text-[#E51D25]">{t("checkout.terms")}</Link>
          </label>
          {submitError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{submitError}</p>}
          <button type="submit" disabled={submitLoading} className="w-full bg-[#E51D25] text-white py-3.5 rounded-full font-black hover:bg-[#B3121A] disabled:opacity-60">{submitLoading ? t("checkout.sending") : `${t("checkout.submit")} • ${fp(grand)}`}</button>
          <p className="text-xs text-zinc-500 text-center">{t("checkout.guarantees")}</p>
        </div>

        <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-6 h-fit">
          <h3 className="font-black">{t("checkout.summary")}</h3>
          <div className="mt-4 space-y-3 max-h-64 overflow-auto">
            {items.map(i => (
              <div key={i.variantId} className="flex gap-3 text-sm border-b border-[#A6B4C0]/10 pb-3">
                <Image src={i.image} alt={i.name} width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-bold line-clamp-1">{i.name}</p>
                  <p className="text-xs text-zinc-500">{i.variantName} × {i.quantity}</p>
                </div>
                <span className="font-bold text-sm">{fp(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-xs font-black mb-2">{t("checkout.promoLabel")}</p>
            <div className="flex gap-2">
              <input value={promo} onChange={e => setPromo(e.target.value)} placeholder={t("checkout.promoPh")} className="flex-1 border border-[#A6B4C0]/30 rounded-full px-4 py-2 text-sm" />
              <button type="button" onClick={applyPromo} disabled={promoLoading} className="bg-[#121212] text-white px-5 py-2 rounded-full text-xs font-black disabled:opacity-60">{promoLoading ? "..." : t("actions.apply")}</button>
            </div>
            {promoMsg && <p className={`text-xs mt-2 font-bold ${discount ? "text-emerald-600" : "text-red-600"}`}>{promoMsg}</p>}
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>{t("checkout.total")}</span><span className="font-bold">{fp(tt)}</span></div>
            {discount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>{t("checkout.discount")} {discount}%</span><span>-{fp(promoDiscount)}</span></div>}
            <div className="flex justify-between"><span>{t("checkout.shipping")}</span><span className={shipping === 0 ? "text-emerald-600 font-bold" : ""}>{shipping === 0 ? t("checkout.free") : fp(shipping)}</span></div>
            <div className="flex justify-between text-lg font-black border-t pt-3"><span>{t("checkout.grand")}</span><span className="text-[#E51D25]">{fp(grand)}</span></div>
          </div>
        </div>
      </form>
    </div>
  )
}
