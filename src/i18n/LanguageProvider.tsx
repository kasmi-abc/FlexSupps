"use client"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Dict, Lang, dict, formatPriceDz, tPath } from "@/i18n/dict"

const LS_KEY = "gog-lang"

interface I18n {
  lang: Lang
  dir: "ltr" | "rtl"
  setLang: (l: Lang) => void
  toggle: () => void
  t: (path: string) => string
  d: Dict
  fp: (price: number) => string
  catName: (slug: string, fallback?: string) => string
  goalLabel: (goal?: string) => string
  goalDesc: (goal?: string) => string
  statusLabel: (s: string) => string
}

const Ctx = createContext<I18n | null>(null)

function readStored(): Lang {
  if (typeof window === "undefined") return "fr"
  try {
    // ?lang= override
    const q = new URLSearchParams(window.location.search).get("lang")
    if (q === "ar" || q === "fr") {
      localStorage.setItem(LS_KEY, q)
      return q
    }
    const v = localStorage.getItem(LS_KEY)
    if (v === "ar" || v === "fr") return v
    // browser-locale default
    const nav = (navigator.language || "fr").toLowerCase()
    return nav.startsWith("ar") ? "ar" : "fr"
  } catch {
    return "fr"
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readStored())

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    try {
      localStorage.setItem(LS_KEY, lang)
    } catch {}
  }, [lang ])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const toggle = useCallback(() => setLangState((p) => (p === "fr" ? "ar" : "fr")), [])

  const value = useMemo<I18n>(() => {
    const d = dict[lang]
    return {
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      toggle,
      t: (path: string) => {
        const v = tPath(d, path)
        if (v !== path) return v
        return tPath(dict.fr, path)
      },
      d,
      fp: (price: number) => formatPriceDz(price, lang),
      catName: (slug: string, fallback?: string) => d.cats[slug] || dict.fr.cats[slug] || fallback || slug,
      goalLabel: (goal?: string) =>
        (goal && (d.goals[goal]?.label || dict.fr.goals[goal]?.label)) || goal || "",
      goalDesc: (goal?: string) =>
        (goal && (d.goals[goal]?.desc || dict.fr.goals[goal]?.desc)) || "",
      statusLabel: (s: string) => d.status[s] || dict.fr.status[s] || s,
    }
  }, [lang, setLang, toggle])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  const v = useContext(Ctx)
  if (!v) throw new Error("useI18n must be used within LanguageProvider")
  return v
}
