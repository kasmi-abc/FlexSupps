"use client"
import { useI18n } from "@/i18n/LanguageProvider"
import { IconMapPin, IconInstagram, IconFacebook } from "@/components/Icons"

const MAPS_URL = "https://maps.app.goo.gl/XB5kVT4Wv1t8pqKA9"
const INSTAGRAM_URL = "https://www.instagram.com/flex_supps_/"
const FACEBOOK_URL = "/"

export function StoreLocation() {
  const { t, d } = useI18n()
  return (
    <section id="location" className="bg-[#121212] py-14">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#E51D25]">
            {d.location.kicker}
          </p>
          <h2 className="section-title mt-2 text-white">{d.location.title}</h2>
          <p className="body-text mt-2 text-white/60">{d.location.sub}</p>
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-white">
            <IconMapPin className="h-5 w-5 text-[#E51D25]" />
            {d.location.address}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#E51D25] px-7 py-3 text-xs font-extrabold tracking-widest text-white transition-all hover:opacity-90 active:scale-95">
              {d.location.directions}
            </a>
            <span className="text-xs font-bold text-white/60">{t("footer.followUs")}</span>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition-all hover:border-[#E51D25] hover:bg-[#E51D25] hover:text-white">
              <IconInstagram className="h-5 w-5" />
            </a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition-all hover:border-[#E51D25] hover:bg-[#E51D25] hover:text-white">
              <IconFacebook className="h-5 w-5" />
            </a>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#E51D25]/30">
          <iframe
            title="Flex Supps map"
            src="https://maps.google.com/maps?q=Flex%20Supps%20Alg%C3%A9rie&t=&z=13&ie=UTF8&iwloc=&output=embed"
            className="h-72 w-full border-0 md:h-80"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}
