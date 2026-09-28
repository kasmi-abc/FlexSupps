"use client"
import Image from "next/image"
import { IconAppleStore, IconCheck, IconGift, IconPlay } from "@/components/Icons"
import { useI18n } from "@/i18n/LanguageProvider"

export function GoshopAppPromo() {
  const { t, d } = useI18n()
  return (
    <section className="bg-[#F8F9FA] px-4 py-10 md:py-14">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#121212]">
        <div className="flex flex-col items-center justify-between gap-8 px-8 py-12 md:flex-row md:px-16">
          <div className="max-w-lg text-center md:text-start">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white">
              <IconGift className="h-4 w-4" /> {t("app.badge")}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white md:text-4xl">
              {t("app.title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {t("app.desc")}
            </p>
            <ul className="mt-4 space-y-1.5">
              {d.app.perks.map((p) => (
                <li key={p} className="flex items-center justify-center gap-2 text-[13px] font-semibold text-white md:justify-start">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[#121212]">
                    <IconCheck className="h-3 w-3" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <button className="flex h-12 items-center gap-2.5 rounded-lg bg-white px-5 text-start transition-all hover:bg-zinc-100 active:scale-95">
                <IconAppleStore className="h-6 w-6 text-[#121212]" />
                <span className="leading-tight">
                  <span className="block text-[10px] font-medium text-zinc-500">{t("app.dl1a")}</span>
                  <span className="block text-sm font-extrabold text-[#121212]">{t("app.dl1b")}</span>
                </span>
              </button>
              <button className="flex h-12 items-center gap-2.5 rounded-lg bg-white px-5 text-start transition-all hover:bg-zinc-100 active:scale-95">
                <IconPlay className="h-5 w-5 text-[#121212]" />
                <span className="leading-tight">
                  <span className="block text-[10px] font-medium text-zinc-500">{t("app.dl2a")}</span>
                  <span className="block text-sm font-extrabold text-[#121212]">{t("app.dl2b")}</span>
                </span>
              </button>
            </div>
          </div>

          <div className="relative shrink-0">
            <div className="w-56 overflow-hidden rounded-[2rem] border-8 border-[#121212] bg-white shadow-2xl sm:w-64">
              <div className="bg-[#121212] px-4 pb-3 pt-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t("app.appName")}</p>
                <p className="text-lg font-black">{t("app.todayOff")}</p>
              </div>
              <Image
                src="/images/app/app-phone.png"
                alt="App"
                loading="lazy"
                width={512}
                height={640}
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="p-3">
                <div className="rounded-full bg-[#E51D25] py-2.5 text-center text-[11px] font-extrabold tracking-widest text-white">
                  {t("app.claim")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
