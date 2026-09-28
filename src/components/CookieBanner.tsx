"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/i18n/LanguageProvider"

const KEY = "gog-consent"

function persist(v: string): void {
  try {
    localStorage.setItem(KEY, v)
  } catch {}
  try {
    document.cookie = `${KEY}=${v}; path=/; max-age=31536000; SameSite=Lax`
  } catch {}
}

function readStored(): boolean {
  try {
    if (localStorage.getItem(KEY)) return false
  } catch {}
  try {
    if (document.cookie.includes(`${KEY}=`)) return false
  } catch {}
  return true
}

export function CookieBanner() {
  const { t } = useI18n()
  const pathname = usePathname()
  const [show, setShow] = useState(() => readStored())

  // banner kill-switch
  const ENABLED = false
  if (!ENABLED) return null

  const choose = (v: string) => {
    persist(v)
    setShow(false)
  }

  if (!show || pathname.startsWith("/admin")) return null
  return (
    <div className="fixed bottom-4 inset-x-4 z-[70] sm:inset-x-auto sm:end-4 sm:max-w-sm">
      <div className="relative rounded-2xl bg-[#121212] text-white p-4 pt-5 shadow-2xl border border-white/10">
        <button
          type="button"
          onClick={() => choose("no")}
          aria-label="Close"
          className="absolute end-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <p className="text-xs leading-relaxed text-white/85 pe-6">{t("cookie.msg")} <Link href="/terms" className="underline text-[#E51D25]">CGV</Link></p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => choose("yes")} className="flex-1 cursor-pointer rounded-full bg-[#E51D25] py-2 text-xs font-black text-white hover:opacity-90 active:scale-95">
            {t("cookie.accept")}
          </button>
          <button type="button" onClick={() => choose("no")} className="flex-1 cursor-pointer rounded-full border border-white/25 py-2 text-xs font-bold hover:bg-white/10 active:scale-95">
            {t("cookie.reject")}
          </button>
        </div>
      </div>
    </div>
  )
}
