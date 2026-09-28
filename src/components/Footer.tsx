"use client"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { useI18n } from "@/i18n/LanguageProvider"
import { IconInstagram, IconFacebook, IconMapPin, IconPhone } from "@/components/Icons"

const MAPS_URL = "https://maps.app.goo.gl/XB5kVT4Wv1t8pqKA9"
const INSTAGRAM_URL = "https://www.instagram.com/flex_supps_/"
const FACEBOOK_URL = "/"
const PHONE_DISPLAY = "0553628299"
const PHONE_LINK = "tel:0553628299"

export function Footer() {
  const { t, d } = useI18n()
  const pathname = usePathname()
  const [email, setEmail] = useState("")
  const [joined, setJoined] = useState(false)

  // skip footer in admin
  if (pathname.startsWith("/admin")) return null

  return (
    <footer className="bg-[#121212]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        {/* newsletter */}
        <div className="flex flex-col gap-5 border-b border-white/15 pb-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/flex-supps-logo.jpg" alt="Flex Supps" width={48} height={48} className="h-12 w-12 rounded-xl object-cover border-2 border-[#E51D25]" />
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-white md:text-2xl">
                {t("footer.newsTitle")}
              </h3>
              <p className="mt-1 text-sm text-white/60">
                {t("footer.newsDesc")}
              </p>
            </div>
          </div>
          {joined ? (
            <p className="rounded-full bg-[#E6F4EA] px-6 py-3 text-sm font-bold text-[#137333]">
              {t("footer.joined")}
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (email.trim()) setJoined(true)
              }}
              className="flex w-full max-w-md gap-2"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("footer.newsPh")}
                className="w-full rounded-full border border-white/20 bg-[#121212] px-5 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#E51D25]"
              />
              <button className="shrink-0 rounded-full bg-white px-7 py-3 text-xs font-extrabold tracking-widest text-[#121212] transition-all hover:bg-[#E51D25] hover:text-white active:scale-95">
                {t("footer.join")}
              </button>
            </form>
          )}
        </div>

        {/* columns */}
        <div className="grid grid-cols-2 gap-8 py-10 md:grid-cols-4">
          {d.footer.cols.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/60 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* contact */}
        <div className="flex flex-col gap-4 border-b border-white/15 py-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-black uppercase tracking-wider text-white">
            {t("footer.contactTitle")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href={PHONE_LINK} className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-[#121212] transition-all hover:bg-[#E51D25] hover:text-white active:scale-95">
              <IconPhone className="h-4 w-4" />
              <span dir="ltr">{PHONE_DISPLAY}</span>
            </a>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-xs font-bold text-white transition-all hover:border-[#E51D25] hover:text-[#E51D25]">
              <IconMapPin className="h-4 w-4" />
              {t("footer.address")}
            </a>
            <span className="text-xs font-bold text-white/60">{t("footer.followUs")}</span>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition-all hover:border-[#E51D25] hover:bg-[#E51D25]">
              <IconInstagram className="h-5 w-5" />
            </a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition-all hover:border-[#E51D25] hover:bg-[#E51D25]">
              <IconFacebook className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* bottom */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-center md:flex-row md:text-start">
          <p className="text-xs text-white/60">
            {t("footer.rights")}
          </p>
          <p className="text-xs text-white/60">
            {t("footer.builtBy")}{" "}
            <a
              href="https://www.instagram.com/abdelkader_haith/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-[#E51D25] underline underline-offset-2 hover:text-white"
            >
              Kasmi .H.Dev
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
