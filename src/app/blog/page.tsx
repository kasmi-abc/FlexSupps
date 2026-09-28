"use client"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/LanguageProvider"

type DbPost = {
  slug: string
  titleFr: string
  titleAr: string
  excerptFr: string
  excerptAr: string
  contentFr: string
  contentAr: string
  category: string
  image: string
  createdAt: string
}

export default function BlogPage() {
  const { t, d, lang } = useI18n()
  const [dbPosts, setDbPosts] = useState<DbPost[] | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/posts", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.posts) && data.posts.length > 0) setDbPosts(data.posts)
          else setDbPosts([])
        })
        .catch(() => setDbPosts([]))
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const posts = (dbPosts && dbPosts.length > 0)
    ? dbPosts.map((p) => ({
        slug: p.slug,
        title: lang === "ar" ? p.titleAr : p.titleFr,
        excerpt: lang === "ar" ? p.excerptAr : p.excerptFr,
        category: p.category,
        image: p.image || "/images/blog/whey-guide.jpg",
        date: new Date(p.createdAt).toISOString().slice(0, 10),
      }))
    : d.blogPosts.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        category: p.category,
        image: p.image,
        date: p.date,
      }))

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-black">{t("blog.title")}</h1>
        <p className="text-sm text-zinc-600 mt-2">{t("blog.sub")}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {posts.map((p) => (
          <article key={p.slug} className="bg-white border border-[#A6B4C0]/20 rounded-2xl overflow-hidden hover:shadow-md transition group">
            <div className="relative h-48 overflow-hidden bg-[#FFFFFF]">
              <Image src={p.image} alt={p.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition duration-500" />
              {!!p.category && <span className="absolute top-3 end-3 bg-[#E51D25] text-white text-xs font-black px-3 py-1 rounded-full">{p.category}</span>}
            </div>
            <div className="p-5">
              <p className="text-xs text-zinc-500">{p.date}</p>
              <h3 className="font-black mt-2 line-clamp-2">{p.title}</h3>
              <p className="text-sm text-zinc-600 mt-2 line-clamp-2">{p.excerpt}</p>
              <Link href={`/blog/${p.slug}`} className="inline-block mt-4 text-sm font-black text-[#E51D25] underline">{t("blog.read")}</Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 bg-[#E51D25] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-black">{t("blog.calcT")}</p>
          <p className="text-sm text-black/70">{t("blog.calcS")}</p>
        </div>
        <Link href="/bmi" className="bg-black text-white px-6 py-2 rounded-full text-sm font-black">{t("blog.calcBtn")}</Link>
      </div>
    </div>
  )
}
