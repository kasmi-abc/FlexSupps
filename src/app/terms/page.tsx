"use client"
import Link from "next/link"
import { useI18n } from "@/i18n/LanguageProvider"

export default function TermsPage() {
  const { t, d } = useI18n()
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-zinc-500">
        <Link href="/" className="hover:underline">{t("breadcrumb.home")}</Link>
        <span className="mx-1">›</span>
        <span className="text-black font-bold">{t("terms.title")}</span>
      </p>
      <h1 className="text-3xl font-black mt-4">{t("terms.title")}</h1>
      <p className="text-xs text-zinc-400 mt-1">{t("terms.updated")}</p>

      <div className="mt-6 space-y-4">
        {d.terms.sections.map((s) => (
          <div key={s.h} className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5">
            <h2 className="font-black">{s.h}</h2>
            {s.ps.map((p) => (
              <p key={p} className="text-sm text-zinc-600 mt-2 leading-relaxed">{p}</p>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/products" className="inline-block bg-[#E51D25] text-white px-8 py-3 rounded-full font-black">{t("actions.shopNow")}</Link>
      </div>
    </div>
  )
}
