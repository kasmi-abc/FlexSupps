"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { useI18n } from "@/i18n/LanguageProvider"
export default function AdminSecurity() {
  const { t } = useI18n()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [qr, setQr] = useState("")
  const [secret, setSecret] = useState("")
  const [code, setCode] = useState("")
  const [msg, setMsg] = useState("")
  const [loading, setLoading] = useState(false)
  const [cur, setCur] = useState("")
  const [next, setNext] = useState("")
  const [conf, setConf] = useState("")
  const [passMsg, setPassMsg] = useState("")
  const [passOk, setPassOk] = useState(false)

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassMsg("")
    setPassOk(false)
    if (next !== conf) { setPassMsg(t("twoFactor.mismatch")); return }
    if (next.length < 8) { setPassMsg(t("twoFactor.passWeak")); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: cur, next }),
      })
      const data = await res.json()
      if (res.ok) {
        setPassOk(true)
        setCur(""); setNext(""); setConf("")
      } else {
        setPassMsg(data.error || "Error")
      }
    } catch {
      setPassMsg("Error")
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    try {
      const res = await fetch("/api/auth/2fa", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setEnabled(!!data.enabled)
      }
    } catch {}
  }

  useEffect(() => {
    const t = setTimeout(() => { void refresh() }, 0)
    return () => clearTimeout(t)
  }, [])

  const setup = async () => {
    setMsg("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      })
      const data = await res.json()
      if (res.ok) {
        setQr(data.qr)
        setSecret(data.secret)
      } else setMsg(data.error || "Error")
    } catch {
      setMsg("Error")
    } finally {
      setLoading(false)
    }
  }

  const enable = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", code, secret }),
      })
      const data = await res.json()
      if (res.ok) {
        setQr("")
        setSecret("")
        setCode("")
        refresh()
      } else setMsg(data.error || t("twoFactor.err"))
    } catch {
      setMsg("Error")
    } finally {
      setLoading(false)
    }
  }

  const disable = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", code }),
      })
      const data = await res.json()
      if (res.ok) {
        setCode("")
        refresh()
      } else setMsg(data.error || t("twoFactor.err"))
    } catch {
      setMsg("Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-black">{t("twoFactor.setupT")}</h1>
      <p className="text-sm text-zinc-500 mt-1">
        {enabled === null ? "..." : enabled ? t("twoFactor.enabled") : t("twoFactor.disabled")}
      </p>

      {enabled === false && (
        <div className="mt-6 bg-white border border-[#A6B4C0]/20 rounded-2xl p-5">
          <p className="text-sm font-bold">{t("twoFactor.setupS")}</p>
          {!qr ? (
            <button type="button" onClick={setup} disabled={loading} className="mt-4 bg-[#121212] text-white px-6 py-2.5 rounded-full text-sm font-black disabled:opacity-60">
              {loading ? "..." : t("twoFactor.setupT")}
            </button>
          ) : (
            <form onSubmit={enable} className="mt-4 space-y-3">
              <Image src={qr} alt="2FA QR" width={192} height={192} className="h-48 w-48 rounded-xl border border-[#A6B4C0]/30" />
              <p className="text-xs text-zinc-500">{t("twoFactor.scanS")}</p>
              <p className="text-xs font-mono bg-[#FFFFFF] border border-[#A6B4C0]/30 rounded-xl px-3 py-2 break-all" dir="ltr">{secret}</p>
              <input
                placeholder={t("twoFactor.codePh")}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                dir="ltr"
                className="border border-[#A6B4C0]/30 rounded-xl px-4 py-2.5 text-sm text-center font-mono tracking-[0.5em] focus:outline-none focus:border-[#E51D25]"
                required
              />
              <button type="submit" disabled={loading} className="block bg-[#E51D25] text-white px-6 py-2.5 rounded-full text-sm font-black disabled:opacity-60">
                {t("twoFactor.enable")}
              </button>
            </form>
          )}
        </div>
      )}

      {enabled === true && (
        <form onSubmit={disable} className="mt-6 bg-white border border-[#A6B4C0]/20 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-bold">{t("twoFactor.disableS")}</p>
          <input
            placeholder={t("twoFactor.codePh")}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            dir="ltr"
            className="border border-[#A6B4C0]/30 rounded-xl px-4 py-2.5 text-sm text-center font-mono tracking-[0.5em] focus:outline-none focus:border-[#E51D25]"
            required
          />
          <button type="submit" disabled={loading} className="block border-2 border-red-500 text-red-600 px-6 py-2.5 rounded-full text-sm font-black disabled:opacity-60">
            {t("twoFactor.disable")}
          </button>
        </form>
      )}

      {msg && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mt-4">{msg}</p>}

      <form onSubmit={changePassword} className="mt-6 bg-white border border-[#A6B4C0]/20 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-black">{t("twoFactor.passTitle")}</p>
        <input
          type="password"
          placeholder={t("twoFactor.curPh")}
          value={cur}
          onChange={e => setCur(e.target.value)}
          className="w-full border border-[#A6B4C0]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E51D25]"
          required
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            type="password"
            placeholder={t("twoFactor.newPh")}
            value={next}
            onChange={e => setNext(e.target.value)}
            className="border border-[#A6B4C0]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E51D25]"
            required
          />
          <input
            type="password"
            placeholder={t("twoFactor.confPh")}
            value={conf}
            onChange={e => setConf(e.target.value)}
            className="border border-[#A6B4C0]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E51D25]"
            required
          />
        </div>
        {passMsg && <p className="text-sm text-red-600 font-bold">{passMsg}</p>}
        {passOk && <p className="text-sm text-emerald-600 font-bold">{t("twoFactor.changedOk")}</p>}
        <button type="submit" disabled={loading} className="bg-[#121212] text-white px-6 py-2.5 rounded-full text-sm font-black disabled:opacity-60">
          {t("twoFactor.changeBtn")}
        </button>
      </form>
    </div>
  )
}
