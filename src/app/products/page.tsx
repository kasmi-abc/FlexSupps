"use client"
import Link from "next/link"
import { Suspense } from "react"
import { ProductsClient } from "@/components/ProductsClient"
import { useI18n } from "@/i18n/LanguageProvider"

function Crumb() {
  const { t } = useI18n()
  return (
    <p className="text-sm text-zinc-500">
      <Link href="/" className="hover:underline">{t("breadcrumb.home")}</Link> <span className="mx-1">›</span> <span className="text-black font-bold">{t("breadcrumb.store")}</span>
    </p>
  )
}

function Loading() {
  const { t } = useI18n()
  return <div className="py-16 text-center text-sm">{t("actions.search")}...</div>
}

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Crumb />
      <Suspense fallback={<Loading />}>
        <ProductsClient />
      </Suspense>
    </div>
  )
}
