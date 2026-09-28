"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useI18n } from "@/i18n/LanguageProvider"

type Review = {
  id: string
  userName: string
  rating: number
  comment: string
  approved: boolean
  createdAt: string
  product: { name: string; slug: string }
}

export default function AdminReviews() {
  const { t } = useI18n()
  const [list, setList] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" })
      if (res.ok) setList(((await res.json()).reviews || []) as Review[])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [])

  const moderate = async (id: string, approved: boolean) => {
    try {
      await fetch(`/api/reviews?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      })
      load()
    } catch {}
  }

  const del = async (id: string) => {
    if (!confirm(t("reviewsA.delete") + " ?")) return
    try {
      await fetch(`/api/reviews?id=${id}`, { method: "DELETE" })
      load()
    } catch {}
  }

  return (
    <div>
      <h1 className="text-xl font-black">{t("reviewsA.title")}</h1>
      <p className="text-sm text-zinc-500">{t("reviewsA.sub")}</p>

      {loading ? (
        <p className="text-sm text-center py-8">...</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-zinc-500 mt-4">{t("reviewsA.empty")}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {list.map((r) => (
            <div key={r.id} className={`border rounded-2xl p-4 ${r.approved ? "bg-white border-[#A6B4C0]/15" : "bg-zinc-50 border-dashed border-[#A6B4C0]/30"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/products/${r.product.slug}`} className="text-sm font-black hover:text-[#E51D25]">{r.product.name}</Link>
                <span className="text-[#E51D25] text-sm">{"★".repeat(r.rating)}<span className="text-zinc-300">{"★".repeat(5 - r.rating)}</span></span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${r.approved ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"}`}>
                  {r.approved ? t("reviewsA.shown") : t("reviewsA.hidden")}
                </span>
                <span className="ms-auto flex gap-2">
                  {r.approved ? (
                    <button type="button" onClick={() => moderate(r.id, false)} className="text-xs font-bold border border-[#A6B4C0]/30 px-3 py-1.5 rounded-full">{t("reviewsA.hide")}</button>
                  ) : (
                    <button type="button" onClick={() => moderate(r.id, true)} className="text-xs font-black bg-[#137333] text-white px-3 py-1.5 rounded-full">{t("reviewsA.approve")}</button>
                  )}
                  <button type="button" onClick={() => del(r.id)} className="text-xs text-red-600 underline">{t("reviewsA.delete")}</button>
                </span>
              </div>
              <p className="text-sm mt-1"><span className="font-bold">{r.userName}</span> — <span className="text-zinc-600" dir="auto">{r.comment}</span></p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
