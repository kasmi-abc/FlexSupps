"use client"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"

type Post = {
  slug: string
  titleFr: string
  titleAr: string
  excerptFr: string
  excerptAr: string
  contentFr: string
  contentAr: string
  category: string
  image: string
  published: boolean
}

const empty: Post = {
  slug: "", titleFr: "", titleAr: "", excerptFr: "", excerptAr: "",
  contentFr: "", contentAr: "", category: "", image: "", published: true,
}

export default function AdminBlog() {
  const { t, lang } = useI18n()
  const [list, setList] = useState<Post[]>([])
  const [form, setForm] = useState<Post>(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [show, setShow] = useState(false)
  const [msg, setMsg] = useState("")

  const load = async () => {
    try {
      const res = await fetch("/api/posts?admin=1", { cache: "no-store" })
      if (res.ok) setList(((await res.json()).posts || []) as Post[])
    } catch {}
  }

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [])

  const startAdd = () => {
    setForm(empty)
    setEditing(null)
    setShow(true)
    setMsg("")
  }

  const startEdit = (p: Post) => {
    setForm({ ...p })
    setEditing(p.slug)
    setShow(true)
    setMsg("")
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg("")
    try {
      const url = editing ? `/api/posts?slug=${encodeURIComponent(editing)}` : "/api/posts"
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setMsg(data.error || "Error"); return }
      setShow(false)
      setForm(empty)
      setEditing(null)
      load()
    } catch {
      setMsg("Error")
    }
  }

  const del = async (slug: string) => {
    if (!confirm(t("blogA.confirmDel"))) return
    try {
      await fetch(`/api/posts?slug=${encodeURIComponent(slug)}`, { method: "DELETE" })
      load()
    } catch {}
  }

  const inp = "border border-[#A6B4C0]/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E51D25]"

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">{t("blogA.title")}</h1>
          <p className="text-sm text-zinc-500">{t("blogA.sub")}</p>
        </div>
        <button type="button" onClick={() => (show ? setShow(false) : startAdd())} className="bg-[#E51D25] text-white px-5 py-2 rounded-full text-sm font-black">
          {show ? t("blogA.cancel") : t("blogA.add")}
        </button>
      </div>

      {show && (
        <form onSubmit={save} className="bg-white border border-[#A6B4C0]/20 rounded-2xl p-5 mt-4 grid md:grid-cols-2 gap-3">
          <input placeholder={t("blogA.slugPh")} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inp} required disabled={!!editing} dir="ltr" />
          <input placeholder={t("blogA.catPh")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inp} />
          <input placeholder={t("blogA.titleFrPh")} value={form.titleFr} onChange={(e) => setForm({ ...form, titleFr: e.target.value })} className={inp} required />
          <input placeholder={t("blogA.titleArPh")} value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} className={inp} required />
          <input placeholder={t("blogA.exFrPh")} value={form.excerptFr} onChange={(e) => setForm({ ...form, excerptFr: e.target.value })} className={inp} />
          <input placeholder={t("blogA.exArPh")} value={form.excerptAr} onChange={(e) => setForm({ ...form, excerptAr: e.target.value })} className={inp} />
          <textarea placeholder={t("blogA.contFrPh")} value={form.contentFr} onChange={(e) => setForm({ ...form, contentFr: e.target.value })} className={`${inp} md:col-span-1`} rows={6} required />
          <textarea placeholder={t("blogA.contArPh")} value={form.contentAr} onChange={(e) => setForm({ ...form, contentAr: e.target.value })} className={`${inp} md:col-span-1`} rows={6} required />
          <input placeholder={t("blogA.imgPh")} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={`${inp} md:col-span-2`} dir="ltr" />
          <label className="md:col-span-2 flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-5 w-5 accent-[#E51D25]" />
            {t("blogA.published")}
          </label>
          {msg && <p className="md:col-span-2 text-sm text-red-600">{msg}</p>}
          <button type="submit" className="md:col-span-2 bg-[#121212] text-white py-3 rounded-xl font-black">{t("blogA.save")}</button>
        </form>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-zinc-500 mt-6">{t("blogA.empty")}</p>
      ) : (
        <div className="mt-6 space-y-2">
          {list.map((p) => (
            <div key={p.slug} className="bg-white border border-[#A6B4C0]/15 rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-52">
                <p className="font-black text-sm">{lang === "ar" ? p.titleAr : p.titleFr}</p>
                <p className="text-xs text-zinc-500 font-mono" dir="ltr">/blog/{p.slug} {p.published ? "●" : "○"}</p>
              </div>
              <button type="button" onClick={() => startEdit(p)} className="text-xs font-black border border-[#A6B4C0]/30 px-4 py-1.5 rounded-full">{t("blogA.edit")}</button>
              <button type="button" onClick={() => del(p.slug)} className="text-xs text-red-600 underline">{t("blogA.delete")}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
