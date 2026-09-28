"use client"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"

type Client = {
  phone: string
  name: string
  wilaya: string
  orders: number
  spent: number
  last: string
  points: number
}

type Cart = {
  id: string
  phone: string | null
  items: { name: string; price: number; quantity: number; image?: string }[]
  total: number
  reminded: boolean
  ordered?: boolean
  updatedAt: string
}

export default function AdminClients() {
  const { t, fp } = useI18n()
  const [clients, setClients] = useState<Client[]>([])
  const [carts, setCarts] = useState<Cart[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const [cRes, aRes] = await Promise.all([
        fetch("/api/clients", { cache: "no-store" }),
        fetch("/api/abandoned", { cache: "no-store" }),
      ])
      if (cRes.ok) setClients(((await cRes.json()).clients || []) as Client[])
      if (aRes.ok) {
        const d = await aRes.json()
        setCarts(((d.carts || []) as Cart[]).filter((c) => !c.ordered))
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [])

  const redeem = async (phone: string) => {
    setMsg("")
    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", phone }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg(`${t("clients.redeemedOk")}: ${data.code} (-${data.discount}%)`)
        load()
      } else {
        setMsg(t("clients.noPoints"))
      }
    } catch {
      setMsg("Error")
    }
    setTimeout(() => setMsg(""), 5000)
  }

  return (
    <div>
      <h1 className="text-xl font-black">{t("clients.title")}</h1>
      <p className="text-sm text-zinc-500">{t("clients.sub")}</p>
      <p className="inline-block mt-2 bg-[#FFFFFF] border border-[#A6B4C0]/30 px-3 py-1 rounded-full text-xs font-bold">{t("clients.rule")}</p>
      {msg && <p className="text-sm font-bold bg-[#E6F4EA] border border-[#137333]/30 text-[#137333] rounded-xl p-3 mt-3">{msg}</p>}

      {loading ? (
        <p className="text-sm text-center py-8">...</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-zinc-500 mt-4">{t("clients.empty")}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {clients.map((c) => (
            <div key={c.phone} className="bg-white border border-[#A6B4C0]/15 rounded-2xl p-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <div>
                <p className="font-black text-sm">{c.name} <span dir="ltr" className="font-mono font-normal text-zinc-500">{c.phone}</span></p>
                <p className="text-xs text-zinc-500">{c.wilaya} • {t("clients.last")}: {c.last}</p>
              </div>
              <div className="text-xs">
                <p><span className="text-zinc-500">{t("clients.orders")}: </span><span className="font-black">{c.orders}</span></p>
                <p><span className="text-zinc-500">{t("clients.spent")}: </span><span className="font-black">{fp(c.spent)}</span></p>
              </div>
              <div className="ms-auto flex items-center gap-2">
                <span className="bg-[#E51D25] text-white text-xs font-black px-3 py-1 rounded-full">★ {c.points} {t("clients.points")}</span>
                <a href={`https://wa.me/213${c.phone.replace(/\s/g, "").slice(1)}`} target="_blank" rel="noopener noreferrer" className="bg-[#121212] text-white px-4 py-1.5 rounded-full text-xs font-black">WhatsApp</a>
                <button type="button" onClick={() => redeem(c.phone)} className="border border-[#A6B4C0]/30 px-3 py-1.5 rounded-full text-xs font-black hover:bg-[#FFFFFF]">
                  {t("clients.redeem")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-lg font-black mt-8">{t("clients.cartsT")} ({carts.length})</h2>
      {carts.length === 0 ? (
        <p className="text-sm text-zinc-500 mt-2">{t("clients.cartsEmpty")}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {carts.map((c) => (
            <div key={c.id} className="bg-white border border-[#A6B4C0]/15 rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-48">
                <p className="font-black text-sm" dir="ltr">{c.phone || "—"}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {c.items.map((i) => `${i.name} ×${i.quantity}`).join(" • ")}
                </p>
                <p className="text-xs font-black mt-1">{fp(c.total)}</p>
              </div>
              {c.reminded
                ? <span className="text-xs font-bold text-emerald-600">{t("clients.reminded")}</span>
                : (
                  <>
                    {c.phone && (
                      <a
                        href={`https://wa.me/213${c.phone.replace(/\s/g, "").slice(1)}?text=${encodeURIComponent("Flex Supps")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#137333] text-white px-4 py-1.5 rounded-full text-xs font-black"
                      >
                        {t("clients.remind")}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch("/api/abandoned", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: c.id, reminded: true }),
                        })
                        load()
                      }}
                      className="text-xs underline text-zinc-500"
                    >
                      {t("clients.markReminded")}
                    </button>
                  </>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
