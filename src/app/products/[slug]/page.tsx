import { products } from "@/data/products"
import { ProductPageClient } from "@/components/ProductPageClient"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = products.find(pr => pr.slug === slug)
  if (!p) return { title: slug }
  return {
    title: `${p.name} - ${p.brand}`,
    description: p.shortDesc || p.description.slice(0, 150),
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.name, description: p.description.slice(0, 150), images: [p.images[0]] },
  }
}

export function generateStaticParams() {
  return products.map(p => ({ slug: p.slug }))
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = products.find(p => p.slug === slug)
  const related = product
    ? products.filter(p => p.category.slug === product.category.slug && p.id !== product.id).slice(0, 4)
    : []
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        brand: { "@type": "Brand", name: product.brand },
        description: product.description.slice(0, 200),
        image: product.images.map((i) => `https://flex-supps.dz${i}`),
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "DZD",
          price: (product.variants.find((v) => v.isDefault) || product.variants[0]).price,
          availability: "https://schema.org/InStock",
        },
      }
    : null
  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ProductPageClient product={product} related={related} slug={slug} />
    </>
  )
}
