"use client"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { products as initialProducts } from "@/data/products"
import { notifyProductsUpdate } from "@/hooks/useProducts"
import { useI18n } from "@/i18n/LanguageProvider"

type AdminProduct = typeof initialProducts[0]
const LS_KEY = "z1-admin-products"

const brandOptions = ["Optimum Nutrition", "MyProtein", "Dymatize", "MuscleTech", "Now Foods", "C4", "BSN", "Scitec Nutrition"] as const

export default function AdminProducts() {
  const { t, d, fp, lang } = useI18n()
  const categoryLabels: Record<string, string> = d.cats
  const flavorOptions = lang === "fr"
    ? ["Chocolat", "Vanille", "Fraise", "Cookies", "Nature"]
    : ["شوكولاتة", "فانيليا", "فراولة", "كوكيز", "بدون نكهة"]
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: "", brand: "", customBrand: "", price: "", stock: "", category: "protein", goal: "MUSCLE_GAIN" })
  const [brandMode, setBrandMode] = useState<"select" | "custom">("select")
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [flavorStocks, setFlavorStocks] = useState<Record<string, string>>({})
  const [sharedStockMode, setSharedStockMode] = useState(true)
  const [images, setImages] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/products?limit=50", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (data.products && data.products.length) {
          setProducts(data.products)
          localStorage.setItem(LS_KEY, JSON.stringify(data.products))
          notifyProductsUpdate()
          setLoading(false)
          return
        }
      }
    } catch {}
    const saved = localStorage.getItem(LS_KEY)
    setProducts(saved ? JSON.parse(saved) : initialProducts)
    setLoading(false)
  }

  useEffect(() => {
    const t = setTimeout(() => { void fetchProducts() }, 0)
    return () => clearTimeout(t)
  }, [])

  const saveLocal = (next: AdminProduct[]) => {
    setProducts(next)
    localStorage.setItem(LS_KEY, JSON.stringify(next))
    notifyProductsUpdate()
  }

  const addImages = (files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, 4 - images.length)
    if (images.length + arr.length > 4) {
      setError(t("adminProducts.errMaxImg"))
      return
    }
    arr.forEach(f => {
      if (f.size > 2 * 1024 * 1024) { setError(t("adminProducts.errImgSize")); return }
      const reader = new FileReader()
      reader.onload = () => {
        setImages(prev => prev.length < 4 ? [...prev, reader.result as string] : prev)
      }
      reader.readAsDataURL(f)
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files?.length) addImages(e.dataTransfer.files)
  }

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setError("")
    if (images.length === 0) { setError(t("adminProducts.errImgRequired")); return }
    if (!form.name.trim() || !form.price) { setError(t("adminProducts.errNamePrice")); return }
    const brandFinal = brandMode === "custom" ? form.customBrand.trim() : form.brand
    if (!brandFinal) { setError(t("adminProducts.errBrand")); return }

    const baseSlug = form.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u0600-\u06FF\-]/g, "") || `product-${Date.now()}`
    let slug = baseSlug; let c = 1
    const existingSlugs = new Set(products.map(p => p.slug).concat(initialProducts.map(p => p.slug)))
    while (existingSlugs.has(slug)) slug = `${baseSlug}-${c++}`

    const now = Date.now()
    interface VariantInput {
      id: string
      name: string
      sku: string
      price: number
      stock: number
      attributes: Record<string, string>
      isDefault: boolean
      image: string
    }
    const variants: VariantInput[] = []
    if (selectedFlavors.length === 0) {
      variants.push({ id: `v-${now}`, name: "Default", sku: `SKU-${now.toString().slice(-6)}`, price: Number(form.price), stock: Number(form.stock) || 10, attributes: {}, isDefault: true, image: images[0] })
    } else {
      selectedFlavors.forEach((fl, idx) => {
        const stock = sharedStockMode ? (Number(form.stock) || 10) : (Number(flavorStocks[fl]) || 10)
        variants.push({
          id: `v-${now}-${idx}`,
          name: `${fl}`,
          sku: `SKU-${now.toString().slice(-6)}-${idx}`,
          price: Number(form.price),
          stock,
          attributes: { flavor: fl },
          isDefault: idx === 0,
          image: images[0],
        })
      })
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug,
          description: `${form.name} - ${categoryLabels[form.category] || form.category}`,
          shortDesc: `${brandFinal} • ${categoryLabels[form.category] || form.category}`,
          brand: brandFinal,
          goal: form.goal,
          images,
          isFeatured: true,
          categorySlug: form.category,
          variants,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("adminProducts.errSaveNeon"))
        throw new Error(typeof data.error === "string" ? data.error : "save failed")
      }
      await fetchProducts()
      setShowAdd(false)
      setForm({ name: "", brand: "", customBrand: "", price: "", stock: "", category: "protein", goal: "MUSCLE_GAIN" })
      setSelectedFlavors([]); setFlavorStocks({}); setImages([]); setBrandMode("select")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ""
      if (!msg.includes("SKU")) {
        const newP: AdminProduct = {
          id: now.toString(),
          name: form.name.trim(),
          slug,
          description: `${form.name} - ${categoryLabels[form.category] || form.category}`,
          shortDesc: `${brandFinal} • ${categoryLabels[form.category] || form.category}`,
          brand: brandFinal,
          goal: form.goal as AdminProduct["goal"],
          images,
          isFeatured: true,
          isSubscription: false,
          subscriptionDiscount: 0,
          rating: 5,
          reviewCount: 0,
          category: { id: form.category, name: categoryLabels[form.category] || form.category, slug: form.category },
          variants,
          reviews: [],
        }
        saveLocal([newP, ...products])
        setShowAdd(false)
        setForm({ name: "", brand: "", customBrand: "", price: "", stock: "", category: "protein", goal: "MUSCLE_GAIN" })
        setSelectedFlavors([]); setFlavorStocks({}); setImages([]); setBrandMode("select")
        if (!error) setError(t("adminProducts.savedLocal"))
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleFlavor = (fl: string) => {
    setSelectedFlavors(prev => prev.includes(fl) ? prev.filter(x => x !== fl) : [...prev, fl])
  }

  const handleDelete = async (slug: string) => {
    if (!confirm(t("adminProducts.confirmDelete"))) return
    try {
      const res = await fetch(`/api/products/${slug}`, { method: "DELETE" })
      if (res.ok) { fetchProducts(); return }
    } catch {}
    saveLocal(products.filter(p => p.slug !== slug))
  }

  const handleCostEdit = async (slug: string, cost: number) => {
    if (!Number.isFinite(cost) || cost < 0) return
    try {
      const res = await fetch(`/api/products/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ costPrice: cost }) })
      if (res.ok) { fetchProducts(); return }
    } catch {}
    const next = products.map(prod => {
      if (prod.slug !== slug) return prod
      const v = prod.variants[0]
      return { ...prod, variants: [{ ...v, costPrice: cost }, ...prod.variants.slice(1)] }
    })
    saveLocal(next)
  }

  const handleStockEdit = async (slug: string, delta: number) => {
    const p = products.find(x => x.slug === slug)
    if (!p) return
    const newStock = Math.max(0, (p.variants[0]?.stock || 0) + delta)
    try {
      const res = await fetch(`/api/products/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock: newStock }) })
      if (res.ok) { fetchProducts(); return }
    } catch {}
    const next = products.map(prod => {
      if (prod.slug !== slug) return prod
      const v = prod.variants[0]
      return { ...prod, variants: [{ ...v, stock: newStock }, ...prod.variants.slice(1)] }
    })
    saveLocal(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">{t("adminProducts.title")}</h1>
          <p className="text-sm text-zinc-500">{loading ? t("adminProducts.loadingSub") : `${products.length} • Neon ✓ • DA`}</p>
        </div>
        <button type="button" onClick={() => setShowAdd(!showAdd)} className="bg-[#E51D25] text-white px-5 py-2 rounded-full text-sm font-black">
          {showAdd ? t("adminProducts.cancel") : t("adminProducts.add")}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5 mt-4 grid md:grid-cols-2 gap-3">
          <input placeholder={t("adminProducts.namePh")} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E51D25]" required />
          <div className="flex gap-2">
            {brandMode === "select" ? (
              <select value={form.brand} onChange={e => {
                if (e.target.value === "__custom") setBrandMode("custom")
                else setForm({ ...form, brand: e.target.value })
              }} className="flex-1 border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm bg-white" required>
                <option value="">{t("adminProducts.brandSelect")}</option>
                {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
                <option value="__custom">{t("adminProducts.brandCustomOpt")}</option>
              </select>
            ) : (
              <div className="flex-1 flex gap-2">
                <input placeholder={t("adminProducts.brandCustomPh")} value={form.customBrand} onChange={e => setForm({ ...form, customBrand: e.target.value })} className="flex-1 border border-[#E51D25] rounded-xl px-3 py-2.5 text-sm bg-[#FFFFFF]" required />
                <button type="button" onClick={() => setBrandMode("select")} className="text-xs underline">{t("adminProducts.back")}</button>
              </div>
            )}
          </div>

          <input placeholder={t("adminProducts.pricePh")} type="number" min={100} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E51D25]" required />
          <div className="flex items-center gap-2">
            <input placeholder={selectedFlavors.length ? t("adminProducts.stockSharedPh") : t("adminProducts.stockPh")} type="number" min={0} value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="flex-1 border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E51D25]" required={selectedFlavors.length === 0 || sharedStockMode} />
          </div>

          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm bg-white">
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} className="border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm bg-white">
            <option value="MUSCLE_GAIN">{t("bmi.bulk")}</option><option value="WEIGHT_LOSS">{t("bmi.cut")}</option><option value="ENERGY">{t("catalog.gEnergy")}</option><option value="GENERAL">{t("bmi.health")}</option>
          </select>

          <div className="md:col-span-2 bg-[#FFFFFF]/50 border border-[#A6B4C0]/20 rounded-xl p-4">
            <p className="text-xs font-black">{t("adminProducts.flavorsTitle")}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {flavorOptions.map(fl => (
                <button key={fl} type="button" onClick={() => toggleFlavor(fl)} className={`px-3 py-1.5 rounded-full text-xs font-black border ${selectedFlavors.includes(fl) ? "bg-[#121212] text-white border-[#121212]" : "bg-white border-[#A6B4C0]/30 hover:border-[#E51D25]"}`}>{fl} {selectedFlavors.includes(fl) && "✓"}</button>
              ))}
            </div>
            {selectedFlavors.length > 0 && (
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="checkbox" checked={sharedStockMode} onChange={e => setSharedStockMode(e.target.checked)} /> {t("adminProducts.sharedStock")}
                </label>
                {!sharedStockMode && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedFlavors.map(fl => (
                      <div key={fl} className="flex items-center gap-2 bg-white border border-[#A6B4C0]/20 rounded-xl px-3 py-2">
                        <span className="text-xs font-bold flex-1">{fl}</span>
                        <input placeholder={t("adminProducts.perFlavorStock")} type="number" min={0} value={flavorStocks[fl] || ""} onChange={e => setFlavorStocks(s => ({ ...s, [fl]: e.target.value }))} className="w-20 border border-[#A6B4C0]/30 rounded-lg px-2 py-1 text-xs" />
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-zinc-500">{t("adminProducts.variantsNote")} {selectedFlavors.length} variants (SKU)</p>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-black flex items-center gap-2">{t("adminProducts.imagesLabel")}</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`mt-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${dragOver ? "border-[#E51D25] bg-[#E51D25]/10" : "border-[#A6B4C0]/30 bg-[#FFFFFF]/30 hover:border-[#E51D25]/50"}`}
            >
              <p className="text-sm font-bold">{t("adminProducts.dropT")}</p>
              <p className="text-xs text-zinc-500 mt-1">{t("adminProducts.dropS")} — {images.length}/4</p>
              <button type="button" onClick={e => { e.stopPropagation(); fileRef.current?.click() }} className="mt-3 bg-[#121212] text-white px-5 py-2 rounded-full text-xs font-black">{t("adminProducts.choose")}</button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => e.target.files && addImages(e.target.files)} />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {images.map((src, idx) => (
                <div key={idx} className="relative group">
                  <Image src={src} alt={`img-${idx}`} width={160} height={96} className={`h-24 w-full rounded-xl object-cover border-2 ${idx === 0 ? "border-[#E51D25]" : "border-[#A6B4C0]/20"}`} />
                  {idx === 0 && <span className="absolute top-1 end-1 bg-[#E51D25] text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">{t("adminProducts.main")}</span>}
                  <button type="button" onClick={() => removeImage(idx)} className="absolute -top-1 -start-1 h-6 w-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input placeholder={t("adminProducts.pastePh")} onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  const val = (e.target as HTMLInputElement).value.trim()
                  if (val && images.length < 4) { setImages(p => [...p, val]); (e.target as HTMLInputElement).value = "" }
                }
              }} className="flex-1 border border-[#A6B4C0]/30 rounded-xl px-3 py-2 text-xs" />
              <span className="text-[11px] text-zinc-500 py-2">{t("adminProducts.enterHint")}</span>
            </div>
          </div>

          {error && <p className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
          <button type="submit" disabled={saving} className="md:col-span-2 bg-[#121212] text-white py-3 rounded-xl font-black hover:bg-black disabled:opacity-60">{saving ? t("adminProducts.saving") : t("adminProducts.saveBtn")}</button>
          <p className="md:col-span-2 text-xs text-zinc-500 text-center">{t("adminProducts.saveNote")}</p>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {loading ? <p className="text-sm text-center py-8">{t("adminProducts.loadingSub")}</p> : products.map(p => (
          <div key={p.id} className="bg-white border border-[#A6B4C0]/15 rounded-2xl p-4 flex flex-wrap gap-4 items-center hover:shadow-sm">
            <Image src={p.images[0]} alt={p.name} width={64} height={64} className="h-16 w-16 rounded-xl object-cover border border-[#A6B4C0]/10" />
            <div className="flex-1 min-w-48">
              <p className="font-black text-sm">{p.name}</p>
              <p className="text-xs text-zinc-500">{p.brand} • {p.category.name} • {p.variants[0]?.sku} • slug: {p.slug}</p>
              <p className="text-xs text-zinc-400">{p.variants.length} {t("adminProducts.unitVariants")} • {fp(p.variants[0]?.price || 0)}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {p.variants.map(v => <span key={v.id} className="text-[11px] bg-[#FFFFFF] border border-[#A6B4C0]/20 px-2 py-0.5 rounded-full">{v.name} ({v.stock}) {v.attributes.flavor ? `• ${v.attributes.flavor}` : ""}</span>)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button type="button" onClick={() => handleStockEdit(p.slug, -1)} className="h-9 w-9 rounded-full border border-[#A6B4C0]/30 hover:bg-[#FFFFFF] text-base font-black">−</button>
                <span className="text-xs font-black px-2">{p.variants[0]?.stock} {t("adminProducts.available")}</span>
                <button type="button" onClick={() => handleStockEdit(p.slug, 1)} className="h-9 w-9 rounded-full border border-[#A6B4C0]/30 hover:bg-[#FFFFFF] text-base font-black">+</button>
              </div>
            </div>
            <div className="text-end shrink-0">
              <p className="price text-[#121212] text-sm">{fp(p.variants[0]?.price || 0)}</p>
              <p className="text-[11px] font-mono text-zinc-500">{p.variants[0]?.sku}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-zinc-400">{t("adminProducts.costPh")}</span>
                <input
                  type="number"
                  min={0}
                  defaultValue={p.variants[0]?.costPrice || ""}
                  key={`${p.slug}-${p.variants[0]?.costPrice || 0}`}
                  onBlur={e => { const v = Number(e.target.value); if (e.target.value !== "" && v !== (p.variants[0]?.costPrice || 0)) handleCostEdit(p.slug, v) }}
                  placeholder="0"
                  className="w-20 border border-[#A6B4C0]/30 rounded-lg px-1.5 py-1 text-[11px] text-end"
                />
              </div>
              {(p.variants[0]?.costPrice || 0) > 0 && (
                <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                  +{fp((p.variants[0]?.price || 0) - (p.variants[0]?.costPrice || 0))}
                </p>
              )}
              <button type="button" onClick={() => handleDelete(p.slug)} className="text-xs text-red-600 underline mt-1">{t("adminProducts.delete")}</button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-400 mt-6 text-center">{t("adminProducts.footerNote")}</p>
    </div>
  )
}
