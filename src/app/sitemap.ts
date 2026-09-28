import type { MetadataRoute } from "next"
import { products } from "@/data/products"
import { dict } from "@/i18n/dict"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://flex-supps.dz"
  const staticRoutes = [
    "", "/products", "/cart", "/checkout", "/orders", "/wishlist",
    "/bundles", "/goals", "/bmi", "/blog", "/terms", "/contact",
  ]
  const now = new Date()
  const urls: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${base}${r || "/"}`,
    lastModified: now,
    changeFrequency: r === "" ? "daily" : "weekly",
    priority: r === "" ? 1 : r === "/products" ? 0.9 : 0.7,
  }))
  for (const p of products) {
    urls.push({ url: `${base}/products/${p.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 })
  }
  for (const b of dict.fr.blogPosts) {
    urls.push({ url: `${base}/blog/${b.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.5 })
  }
  return urls
}
