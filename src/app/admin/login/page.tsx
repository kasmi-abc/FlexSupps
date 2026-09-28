"use client"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useI18n } from "@/i18n/LanguageProvider"

export default function AdminLogin() {
  const { t } = useI18n()
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [err, setErr] = useState("")
  const router = useRouter()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr("")
    if (!user.trim() || !pass.trim()) { setErr(t("adminLogin.errEmpty")); return }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.trim(), password: pass }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || t("adminLogin.errInvalid"))
        return
      }
      localStorage.removeItem("z1-admin-auth")
      localStorage.removeItem("z1-admin-exp")
      if (data.need2fa) {
        router.push("/admin/2fa")
      } else {
        router.push("/admin")
      }
      router.refresh()
    } catch {
      setErr(t("adminLogin.errConn"))
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <form onSubmit={handle} className="bg-white border-2 border-[#E51D25]/30 rounded-2xl p-8 w-full max-w-md shadow-lg">
        <div className="text-center">
          <Image src="/flex-supps-logo.jpg" alt="Flex Supps" width={80} height={80} className="h-20 w-20 mx-auto rounded-2xl border-2 border-[#E51D25] object-cover shadow" />
          <h1 className="text-2xl font-black mt-4 font-[var(--font-almarai)]">{t("adminLogin.title")}</h1>
        </div>

        <div className="mt-6 space-y-3">
          <input placeholder={t("adminLogin.userPh")} value={user} onChange={e => setUser(e.target.value)} className="w-full border-2 border-[#A6B4C0]/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E51D25] focus:bg-[#FFFFFF]/50" required />
          <input placeholder={t("adminLogin.passPh")} type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full border-2 border-[#A6B4C0]/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E51D25] focus:bg-[#FFFFFF]/50" required />
          {err && <p className="text-sm text-red-600 font-bold bg-red-50 border border-red-200 rounded-xl p-3">{err}</p>}
          <button type="submit" className="w-full bg-[#E51D25] text-white py-3.5 rounded-xl font-black hover:bg-[#B3121A] text-base">{t("adminLogin.submit")}</button>
        </div>

        <p className="text-xs text-zinc-500 text-center mt-4">{t("adminLogin.protected")}</p>
      </form>
    </div>
  )
}
