"use client"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"

type DbPost = {
  slug: string
  titleFr: string
  titleAr: string
  contentFr: string
  contentAr: string
  image: string
}

export default function BlogPost() {
  const { t, d, lang } = useI18n()
  const params = useParams()
  const slug = typeof params.slug === "string" ? params.slug : ""
  const [dbPost, setDbPost] = useState<DbPost | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/posts", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const found = (data?.posts || []).find((p: DbPost) => p.slug === slug)
          setDbPost(found || null)
          setLoaded(true)
        })
        .catch(() => setLoaded(true))
    }, 0)
    return () => clearTimeout(timer)
  }, [slug])

  if (dbPost) {
    const title = lang === "ar" ? dbPost.titleAr : dbPost.titleFr
    const content = lang === "ar" ? dbPost.contentAr : dbPost.contentFr
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/blog" className="text-xs underline">← {t("post.backBlog")}</Link>
        {!!dbPost.image && <Image src={dbPost.image} alt={title} width={768} height={320} className="w-full h-64 object-cover rounded-2xl mt-4" />}
        <h1 className="text-2xl font-black mt-6">{title}</h1>
        <p className="text-zinc-600 mt-4 leading-relaxed whitespace-pre-line" dir="auto">{content}</p>
        <div className="mt-6 flex gap-2">
          <Link href="/products" className="bg-[#E51D25] text-white px-6 py-2 rounded-full font-black text-sm">{t("post.shop")}</Link>
          <Link href="/bmi" className="border px-6 py-2 rounded-full font-bold text-sm">{t("post.calc")}</Link>
        </div>
      </div>
    )
  }

  if (!loaded) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm">...</div>

  const post = d.blogPosts.find((p) => p.slug === slug)
  if (!post) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><p className="font-black">{t("post.notFound")}</p><Link href="/blog" className="text-[#E51D25] underline">{t("post.backToBlog")}</Link></div>
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/blog" className="text-xs underline">← {t("post.backBlog")}</Link>
      <Image src={post.image} alt={post.title} width={768} height={320} className="w-full h-64 object-cover rounded-2xl mt-4" />
      <h1 className="text-2xl font-black mt-6">{post.title}</h1>
      <p className="text-zinc-600 mt-4 leading-relaxed">{post.content}</p>
      <div className="mt-6 flex gap-2">
        <Link href="/products" className="bg-[#E51D25] text-white px-6 py-2 rounded-full font-black text-sm">{t("post.shop")}</Link>
        <Link href="/bmi" className="border px-6 py-2 rounded-full font-bold text-sm">{t("post.calc")}</Link>
      </div>
    </div>
  )
}
