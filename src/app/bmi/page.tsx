"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useProducts } from "@/hooks/useProducts"
import { useI18n } from "@/i18n/LanguageProvider"

export default function BmiPage() {
  const { t, fp } = useI18n()
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [goal, setGoal] = useState<"MUSCLE_GAIN" | "WEIGHT_LOSS" | "GENERAL">("MUSCLE_GAIN")
  const products = useProducts()
  const [result, setResult] = useState<{ bmi: number; cal: number; protein: number } | null>(null)

  const calc = (e: React.FormEvent) => {
    e.preventDefault()
    const w = Number(weight)
    const h = Number(height) / 100
    if (!w || !h || w < 30 || w > 300 || h < 1 || h > 2.5) return
    const bmi = w / (h * h)
    if (!Number.isFinite(bmi)) return
    const cal = Math.round(w * (goal === "MUSCLE_GAIN" ? 35 : goal === "WEIGHT_LOSS" ? 25 : 30))
    const protein = Math.round(w * (goal === "MUSCLE_GAIN" ? 2 : 1.2))
    setResult({ bmi: Number(bmi.toFixed(1)), cal, protein })
  }

  const suggested = result ? products.filter(p => p.goal === goal).slice(0, 2) : []

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-black">{t("bmi.title")}</h1>
      <p className="text-sm text-zinc-600 mt-1">{t("bmi.sub")}</p>

      <form onSubmit={calc} className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-6 mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="bmi-weight" className="text-xs font-bold">{t("bmi.weight")}</label>
            <input id="bmi-weight" type="number" min={30} max={300} value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" aria-label={t("bmi.weight")} className="w-full mt-1 border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm" required />
          </div>
          <div>
            <label htmlFor="bmi-height" className="text-xs font-bold">{t("bmi.height")}</label>
            <input id="bmi-height" type="number" min={100} max={250} value={height} onChange={e => setHeight(e.target.value)} placeholder="175" aria-label={t("bmi.height")} className="w-full mt-1 border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm" required />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold">{t("bmi.yourGoal")}</label>
          <select value={goal} onChange={e => setGoal(e.target.value as "MUSCLE_GAIN" | "WEIGHT_LOSS" | "GENERAL")} className="w-full mt-1 border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm">
            <option value="MUSCLE_GAIN">{t("bmi.bulk")}</option>
            <option value="WEIGHT_LOSS">{t("bmi.cut")}</option>
            <option value="GENERAL">{t("bmi.health")}</option>
          </select>
        </div>

        <button type="submit" className="w-full bg-[#E51D25] text-white py-3 rounded-xl font-black">{t("bmi.calc")}</button>
      </form>

      {result && (
        <div className="mt-6 bg-[#121212] text-white rounded-2xl p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-white/60">BMI</p><p className="text-xl font-black text-[#E51D25]">{result.bmi}</p></div>
            <div><p className="text-xs text-white/60">{t("bmi.cals")}</p><p className="text-xl font-black text-[#E51D25]">{result.cal}</p></div>
            <div><p className="text-xs text-white/60">{t("bmi.proteinG")}</p><p className="text-xl font-black text-[#E51D25]">{result.protein}</p></div>
          </div>

          <h3 className="font-black mt-6">{t("bmi.suggested")}</h3>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {suggested.map(p => (
              <Link key={p.id} href={`/products/${p.slug}`} className="bg-white text-black rounded-xl p-3 flex gap-3">
                <Image src={p.images[0]} alt={p.name} width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
                <div>
                  <p className="text-xs font-black line-clamp-1">{p.name}</p>
                  <p className="text-xs text-[#E51D25] font-bold">{fp(p.variants[0].price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/products" className="text-sm underline">{t("bmi.browse")}</Link>
      </div>
    </div>
  )
}
