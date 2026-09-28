"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Product } from "@/types"
import { calcDiscount } from "@/lib/utils"
import { addToCartDirect } from "@/store/cart"
import { useI18n } from "@/i18n/LanguageProvider"
import { IconStar, IconCheck, IconTruck, IconPhone } from "@/components/Icons"

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter()
  const { t, fp, lang, catName } = useI18n()
  const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0]
  const [selectedId, setSelectedId] = useState(defaultVariant.id)
  const [qty, setQty] = useState(1)
  const [isSub, setIsSub] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [reviews, setReviews] = useState(
    product.reviews.filter((r) => r.approved !== false)
  )
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState("")
  const [newName, setNewName] = useState("")
  const [activeTab, setActiveTab] = useState<"nutrition" | "ingredients" | "usage">("nutrition")

  const selected = useMemo(() => product.variants.find(v => v.id === selectedId) || defaultVariant, [selectedId, product.variants, defaultVariant])

  const selectVariant = (id: string) => {
    setSelectedId(id)
    setQty(1)
    setActiveImage(0)
  }

  const basePrice = selected.price
  const subPrice = product.isSubscription && isSub ? Math.round(basePrice * (1 - product.subscriptionDiscount / 100)) : basePrice
  const discount = calcDiscount(subPrice, selected.compareAtPrice)
  const saving = basePrice - subPrice
  const displayImage = selected.image || product.images[activeImage] || product.images[0]

  const handleAdd = () => {
    if (selected.stock === 0) return
    addToCartDirect({
      productId: product.id,
      variantId: selected.id,
      name: product.name,
      variantName: selected.name,
      image: selected.image || product.images[0],
      price: subPrice,
      quantity: qty,
      isSubscription: isSub,
    })
    setToast(`${t("detail.addedToast")} ${qty} × ${selected.name} ${isSub ? " (Sub)" : ""}`)
    setTimeout(() => setToast(null), 2500)
  }

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newName.trim().slice(0, 40)
    const comment = newComment.trim().slice(0, 500)
    if (!comment || !name) return
    const safeName = name.replace(/[<>]/g, "")
    const safeComment = comment.replace(/[<>]/g, "")
    const r = { id: Date.now().toString(), userName: safeName, rating: newRating, comment: safeComment, createdAt: new Date().toISOString(), approved: true }
    setReviews([r, ...reviews])
    setNewComment(""); setNewName("")
  }

  return (
    <div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#121212] text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg z-50 border-2 border-[#E51D25]">
          {toast} <Link href="/cart" className="underline ms-2 text-[#E51D25]">{t("detail.viewCart")}</Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-10">
        {/* gallery */}
        <div>
          <div className="bg-white border border-[#A6B4C0]/20 rounded-3xl p-4 group overflow-hidden">
            <div className="relative aspect-square overflow-hidden rounded-2xl">
              <Image src={displayImage} alt={`${product.name} - ${t("detail.imageOf")} ${activeImage + 1} ${t("detail.of")} ${product.images.length}`} loading="lazy" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover rounded-2xl group-hover:scale-125 transition duration-700 cursor-zoom-in" />
            </div>
            <p className="text-xs text-zinc-400 text-center mt-2">{t("detail.zoom")} • {t("detail.imageOf")} {activeImage + 1} {t("detail.of")} {product.images.length}</p>
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {product.images.map((img, i) => (
                <button key={i} type="button" onClick={() => setActiveImage(i)} className={`h-20 w-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${activeImage === i && !selected.image ? "border-[#E51D25] ring-2 ring-[#E51D25]/20" : "border-[#A6B4C0]/20 hover:border-[#E51D25]/50"}`}>
                  <Image src={img} alt={`${t("detail.imageOf")} ${i + 1}`} width={80} height={80} className="w-full h-full object-cover hover:opacity-80" />
                </button>
              ))}
            </div>
          )}

          {/* badges */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white border border-[#A6B4C0]/20 rounded-xl p-3 text-center">
              <IconCheck className="h-5 w-5 mx-auto text-[#E51D25]" />
              <p className="font-black mt-1">{t("detail.authentic")}</p>
              <p className="text-zinc-500 text-[11px]">{t("detail.guaranteed")}</p>
            </div>
            <div className="bg-white border border-[#A6B4C0]/20 rounded-xl p-3 text-center">
              <IconTruck className="h-5 w-5 mx-auto text-[#E51D25]" />
              <p className="font-black mt-1">{t("detail.wilayas")}</p>
              <p className="text-zinc-500 text-[11px]">{t("detail.fastDeliv")}</p>
            </div>
            <div className="bg-white border border-[#A6B4C0]/20 rounded-xl p-3 text-center">
              <IconPhone className="h-5 w-5 mx-auto text-[#E51D25]" />
              <p className="font-black mt-1">{t("detail.safePay")}</p>
              <p className="text-zinc-500 text-[11px]">{t("detail.onDelivery")}</p>
            </div>
          </div>

          {/* tabs */}
          <div className="mt-6 bg-white border border-[#A6B4C0]/20 rounded-2xl overflow-hidden">
            <div className="flex border-b border-[#A6B4C0]/20">
              <button type="button" onClick={() => setActiveTab("nutrition")} className={`flex-1 py-3 text-xs font-black ${activeTab === "nutrition" ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("detail.tabNutrition")}</button>
              <button type="button" onClick={() => setActiveTab("ingredients")} className={`flex-1 py-3 text-xs font-black ${activeTab === "ingredients" ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("detail.tabIngredients")}</button>
              <button type="button" onClick={() => setActiveTab("usage")} className={`flex-1 py-3 text-xs font-black ${activeTab === "usage" ? "bg-[#121212] text-white" : "hover:bg-[#FFFFFF]"}`}>{t("detail.tabUsage")}</button>
            </div>
            <div className="p-5">
              {activeTab === "nutrition" && (
                product.nutrition ? (
                  <div>
                    <div className="bg-[#121212] text-white rounded-xl p-3 flex justify-between text-xs font-black">
                      <span>{t("detail.serving")}: {product.nutrition.servingSize}</span>
                      <span>{product.nutrition.servings} {t("detail.servings")}</span>
                    </div>
                    <table className="w-full text-sm mt-3">
                      <tbody>
                        <tr className="border-b"><td className="py-2 font-bold">{t("detail.calories")}</td><td className="text-end font-black">{product.nutrition.calories}</td></tr>
                        <tr className="border-b"><td className="py-2">{t("detail.protein")}</td><td className="text-end font-black text-[#E51D25]">{product.nutrition.protein}</td></tr>
                        <tr className="border-b"><td className="py-2">{t("detail.carbs")}</td><td className="text-end">{product.nutrition.carbs}</td></tr>
                        <tr className="border-b"><td className="py-2">{t("detail.fat")}</td><td className="text-end">{product.nutrition.fat}</td></tr>
                        <tr><td className="py-2">{t("detail.sugar")}</td><td className="text-end">{product.nutrition.sugar}</td></tr>
                      </tbody>
                    </table>
                    <p className="text-xs text-zinc-500 mt-3">{t("detail.nutriNote")}</p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-zinc-600">{t("detail.nutriEmpty")}</p>
                    <p className="text-xs text-zinc-400 mt-1">{t("detail.nutriEmptyS")}</p>
                  </div>
                )
              )}
              {activeTab === "ingredients" && (
                <div>
                  <p className="text-sm font-black">{t("detail.ingredientsT")}</p>
                  <p className="text-sm text-zinc-700 mt-2 leading-relaxed" dir="auto">{product.ingredients || t("detail.ingredientsD")}</p>
                  <p className="text-xs text-zinc-500 mt-3">{t("detail.ingredientsNote")}</p>
                </div>
              )}
              {activeTab === "usage" && (
                <div>
                  <p className="text-sm font-black">{t("detail.usageT")}</p>
                  <p className="text-sm text-zinc-700 mt-2 leading-relaxed" dir="auto">{product.usage || t("detail.usageD")}</p>
                  <ul className="text-xs text-zinc-600 mt-3 list-disc list-inside space-y-1">
                    <Bullets />
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* info */}
        <div>
          <p className="text-sm text-zinc-500 font-bold">{product.brand} • <Link href={`/products?category=${product.category.slug}`} className="underline decoration-[#E51D25]">{catName(product.category.slug, product.category.name)}</Link></p>
          <h1 className="text-3xl font-black mt-1">{product.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-[#121212] text-white px-3 py-1 rounded-full font-bold">SKU: {selected.sku}</span>
            <span className="bg-white border border-[#A6B4C0]/30 px-3 py-1 rounded-full font-bold">slug: {product.slug}</span>
            <span className="bg-[#FFFFFF] border border-[#A6B4C0]/30 px-3 py-1 rounded-full">ID: {product.id.slice(0, 8)}</span>
            <span className={`px-3 py-1 rounded-full font-black ${selected.stock > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>{selected.stock > 0 ? `${t("detail.availableIn")}: ${selected.stock}` : t("detail.out")}</span>
          </div>
          <p className="text-zinc-600 mt-3 leading-relaxed" dir="auto">{product.description}</p>

          <div className="flex items-center gap-3 mt-4">
            <span className="flex items-center gap-1 bg-[#FFFFFF] border border-[#A6B4C0] px-3 py-1.5 rounded-full text-sm font-bold">
              <IconStar className="h-4 w-4 text-[#E51D25]" filled /> {product.rating}
            </span>
            <span className="text-sm text-zinc-500">({reviews.length} {t("detail.reviewsUnit")})</span>
            <span className="text-sm text-zinc-500">• {product.variants.length} {t("detail.optionsUnit")}</span>
          </div>

          <div className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5 mt-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-black">{fp(subPrice)}</span>
              {selected.compareAtPrice && <span className="line-through text-zinc-400">{fp(selected.compareAtPrice)}</span>}
              {discount > 0 && <span className="bg-[#E51D25] text-white text-xs font-black px-2.5 py-1 rounded-full">-{discount}%</span>}
              {saving > 0 && <span className="bg-[#E51D25] text-white text-xs font-black px-2.5 py-1 rounded-full">{t("card.save")} {fp(saving)}</span>}
            </div>
            <p className="text-xs text-zinc-500 mt-1">{t("detail.for_")} {selected.name} • {selected.stock > 0 ? `${selected.stock} ${t("detail.available")}` : t("detail.out")}</p>

            <div className="mt-5">
              <p className="text-sm font-black mb-2">{t("detail.chooseFlavor")}</p>
              <div className="grid grid-cols-1 gap-2">
                {product.variants.map(v => {
                  const isSelected = v.id === selectedId
                  const subPriceV = product.isSubscription && isSub ? Math.round(v.price * (1 - product.subscriptionDiscount / 100)) : v.price
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => selectVariant(v.id)}
                      disabled={v.stock === 0}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 text-start transition ${isSelected ? "border-[#E51D25] bg-[#FFFFFF]" : "border-[#A6B4C0]/20 bg-white hover:border-[#E51D25]/50"} ${v.stock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div>
                        <p className="text-sm font-black">{v.name}</p>
                        <p className="text-xs text-zinc-500">{Object.values(v.attributes).join(" • ")} • {v.sku}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-sm font-black">{fp(subPriceV)}</p>
                        {v.compareAtPrice && <p className="text-xs line-through text-zinc-400">{fp(v.compareAtPrice)}</p>}
                        <p className={`text-xs font-bold ${v.stock > 5 ? "text-emerald-600" : v.stock > 0 ? "text-amber-600" : "text-red-600"}`}>{v.stock > 0 ? t("detail.available") : t("detail.out")}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {product.isSubscription ? (
              <div className={`mt-5 rounded-xl p-4 border-2 transition ${isSub ? "border-[#E51D25] bg-[#FFFFFF]" : "border-[#A6B4C0]/20 bg-white"}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={isSub} onChange={e => setIsSub(e.target.checked)} className="mt-1 h-5 w-5 accent-[#E51D25]" />
                  <div className="flex-1">
                    <p className="text-sm font-black flex items-center gap-2">
                      {t("detail.subscribe")}
                      <span className="bg-[#E51D25] text-white text-xs px-2 py-0.5 rounded-full">-{product.subscriptionDiscount}%</span>
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">{t("detail.subDesc")} {t("card.save")} {fp(Math.round(selected.price * product.subscriptionDiscount / 100))}.</p>
                    {isSub && <p className="text-xs font-black text-[#E51D25] mt-2">{t("detail.subPrice")} {fp(subPrice)} {t("detail.insteadOf")} {fp(selected.price)}</p>}
                  </div>
                </label>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 mt-4 bg-[#FFFFFF] border border-[#A6B4C0]/20 rounded-xl p-3">{t("detail.noSub")}</p>
            )}

            <div className="flex gap-3 mt-6">
              <div className="flex items-center border border-[#A6B4C0]/30 rounded-full overflow-hidden bg-white">
                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="h-12 w-12 hover:bg-[#FFFFFF] font-black active:bg-[#E51D25]/20">−</button>
                <span className="w-12 text-center font-black select-none">{qty}</span>
                <button type="button" onClick={() => setQty(q => selected.stock === 0 ? q : Math.min(selected.stock, q + 1))} disabled={qty >= selected.stock || selected.stock === 0} className="h-12 w-12 hover:bg-[#FFFFFF] font-black disabled:opacity-30 active:bg-[#E51D25]/20">+</button>
              </div>
              <button
                onClick={handleAdd}
                disabled={selected.stock === 0}
                className="flex-1 bg-[#E51D25] text-white rounded-full font-black hover:bg-[#B3121A] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selected.stock === 0 ? t("detail.out") : `${t("detail.addToCart")} • ${fp(subPrice * qty)}`}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                handleAdd()
                setTimeout(() => router.push("/checkout"), 300)
              }}
              className="w-full mt-3 border-2 border-[#121212] text-[#121212] py-3 rounded-full font-black hover:bg-[#121212] hover:text-white transition"
            >
              {t("detail.orderNow")}
            </button>
            <p className="text-xs text-zinc-500 text-center mt-3">{t("detail.guarantees")}</p>
          </div>

          <div className="mt-8">
            <h3 className="font-black text-lg">{t("detail.reviewsT")} ({reviews.length})</h3>
            <form onSubmit={handleAddReview} className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-4 mt-4">
              <p className="text-sm font-black">{t("detail.addReview")}</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t("detail.yourName")} maxLength={40} aria-label={t("detail.yourName")} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E51D25]" required />
                <select value={newRating} onChange={e => setNewRating(Number(e.target.value))} aria-label="rating" className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2 text-sm">
                  <option value={5}>★★★★★ (5)</option>
                  <option value={4}>★★★★ (4)</option>
                  <option value={3}>★★★ (3)</option>
                  <option value={2}>★★ (2)</option>
                  <option value={1}>★ (1)</option>
                </select>
              </div>
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t("detail.yourComment")} maxLength={500} aria-label={t("detail.yourComment")} className="w-full border border-[#A6B4C0]/30 rounded-xl px-3 py-2 text-sm mt-3 focus:outline-none focus:border-[#E51D25]" rows={3} required />
              <button type="submit" className="mt-3 bg-[#121212] text-white px-6 py-2 rounded-full text-sm font-black">{t("detail.publish")}</button>
            </form>

            <div className="space-y-3 mt-4">
              {reviews.length === 0 ? <p className="text-sm text-zinc-500">{t("detail.noReviews")}</p> :
                reviews.map(r => (
                  <div key={r.id} className="bg-white border border-[#A6B4C0]/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{r.userName}</span>
                      <span className="text-[#E51D25] text-sm">{"★".repeat(r.rating)}<span className="text-zinc-300">{"★".repeat(5 - r.rating)}</span></span>
                    </div>
                    <p className="text-sm mt-1 text-zinc-700" dir="auto">{r.comment}</p>
                    <p className="text-xs text-zinc-400 mt-1">{new Date(r.createdAt).toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-FR", { timeZone: "Africa/Algiers" })}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Bullets() {
  const { d } = useI18n()
  return (
    <>
      {d.detail.usageBullets.map((b: string) => (
        <li key={b}>{b}</li>
      ))}
    </>
  )
}
