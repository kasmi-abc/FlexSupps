"use client"
import Link from "next/link"
import Image from "next/image"
import { useCartStore } from "@/store/cart"
import { useI18n } from "@/i18n/LanguageProvider"
import { useSettings } from "@/hooks/useSettings"
import { IconTruck, IconCart } from "@/components/Icons"
import { useProducts } from "@/hooks/useProducts"

export default function CartPage() {
  const { t, fp } = useI18n()
  const { items, updateQuantity, removeItem, total, clearCart } = useCartStore()
  const settings = useSettings()
  const tt = total()
  const shipping = tt >= settings.shipping_threshold ? 0 : settings.shipping_fee
  const grand = tt + shipping
  const remaining = settings.shipping_threshold - tt
  const allProducts = useProducts()
  const getStock = (variantId: string) => {
    for (const p of allProducts) {
      const v = p.variants.find(v => v.id === variantId)
      if (v) return v.stock
    }
    return 99
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="h-20 w-20 mx-auto rounded-full bg-[#FFFFFF] border-2 border-[#A6B4C0] flex items-center justify-center"><IconCart className="h-8 w-8 text-[#E51D25]" /></div>
        <h1 className="text-2xl font-black mt-4">{t("cart.emptyT")}</h1>
        <p className="text-zinc-500 mt-2">{t("cart.emptyS")}</p>
        <Link href="/products" className="inline-block mt-6 bg-[#E51D25] text-white px-8 py-3 rounded-full font-black">{t("actions.shopNow")}</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-black">{t("cart.title")} ({items.length})</h1>

      {remaining > 0 && remaining < settings.shipping_threshold && (
        <div className="mt-4 bg-[#121212] text-white rounded-full px-4 py-2 text-sm flex items-center gap-2">
          <IconTruck className="h-4 w-4 text-[#E51D25]" />
          {t("cart.freeShipAdd")} {fp(remaining)} {t("cart.freeShipGet")}
          <div className="ms-auto h-2 w-32 bg-white/20 rounded-full overflow-hidden hidden sm:block">
            <div className="h-full bg-[#E51D25]" style={{ width: `${Math.min(100, (tt / settings.shipping_threshold) * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 mt-6">
        <div className="space-y-3">
          {items.map(item => (
            <div key={`${item.variantId}-${item.isSubscription}`} className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-4 flex gap-4">
              <Image src={item.image} alt={item.name} width={80} height={80} className="h-20 w-20 rounded-xl object-cover border border-[#A6B4C0]/10" />
              <div className="flex-1">
                <p className="font-black text-sm">{item.name}</p>
                <p className="text-xs text-zinc-500">{item.variantName} {item.isSubscription && <span className="bg-[#E51D25] text-white px-1.5 py-0.5 rounded-full text-[10px]">Sub</span>}</p>
                <p className="text-sm font-black mt-1 text-[#E51D25]">{fp(item.price)} × {item.quantity} = {fp(item.price * item.quantity)}</p>
                <div className="flex gap-2 mt-3">
                  <div className="flex items-center border border-[#A6B4C0]/30 rounded-full overflow-hidden h-8 bg-white">
                    <button type="button" onClick={() => updateQuantity(item.variantId, item.quantity - 1, item.isSubscription)} className="h-8 w-8 hover:bg-[#FFFFFF] font-black active:bg-[#E51D25]/20">−</button>
                    <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                    <button type="button" onClick={() => { const s = getStock(item.variantId); if (item.quantity < s) updateQuantity(item.variantId, item.quantity + 1, item.isSubscription) }} disabled={item.quantity >= getStock(item.variantId)} className="h-8 w-8 hover:bg-[#FFFFFF] font-black disabled:opacity-30 active:bg-[#E51D25]/20">+</button>
                  </div>
                  <button type="button" onClick={() => removeItem(item.variantId, item.isSubscription)} className="text-xs font-bold underline text-red-600">{t("cart.remove")}</button>
                  {item.isSubscription && <span className="text-xs text-emerald-600 font-bold">{t("cart.saving")} {fp(Math.round(item.price * 0.15))}</span>}
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={clearCart} className="text-sm font-bold underline text-zinc-500">{t("cart.clear")}</button>

          <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-4 mt-4">
            <p className="font-black text-sm">{t("cart.crossT")}</p>
            <p className="text-xs text-zinc-500">{t("cart.crossS")}</p>
            <Link href="/products?category=creatine" className="inline-block mt-3 bg-[#FFFFFF] border border-[#A6B4C0] px-4 py-2 rounded-full text-xs font-black">{t("cart.crossBtn")}</Link>
          </div>
        </div>

        <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-6 h-fit sticky top-24">
          <h3 className="font-black">{t("cart.summary")}</h3>
          <div className="flex justify-between mt-4 text-sm">
            <span>{t("cart.subtotal")}</span><span className="font-bold">{fp(tt)}</span>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span>{t("cart.shipping")}</span><span className={shipping === 0 ? "text-emerald-600 font-black" : "font-bold"}>{shipping === 0 ? t("cart.free") : fp(shipping)}</span>
          </div>
          {shipping === 0 && <p className="text-xs text-emerald-600 font-bold mt-1">{t("cart.freeMsg")}</p>}
          <div className="flex justify-between mt-4 text-lg font-black border-t border-[#A6B4C0]/20 pt-4">
            <span>{t("cart.grand")}</span><span className="text-[#E51D25]">{fp(grand)}</span>
          </div>
          <Link href="/checkout" className="block text-center bg-[#E51D25] text-white py-3.5 rounded-full font-black mt-6 hover:bg-[#B3121A]">{t("cart.checkoutBtn")}</Link>
          <p className="text-xs text-zinc-500 text-center mt-2">{t("cart.guarantees")}</p>
          <div className="mt-4 bg-[#FFFFFF] border border-[#A6B4C0]/20 rounded-xl p-3 text-xs">
            <p className="font-black">{t("cart.promoT")}</p>
            <p className="text-zinc-600">{t("cart.promoS")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
