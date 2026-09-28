"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useI18n } from "@/i18n/LanguageProvider"

const IMAGES = Array.from({ length: 8 }, (_, i) => `/images/hero-slides/slide-${i + 1}.webp`)
const AUTOPLAY_MS = 5000

function CarouselArrow({ next, dir, onGo }: { next: boolean; dir: string; onGo: () => void }) {
  return (
    <button
      type="button"
      onClick={onGo}
      aria-label={next ? "next slide" : "previous slide"}
      className="absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#121212] shadow-lg transition-all hover:scale-105 hover:bg-[#E51D25] hover:text-white active:scale-95"
      style={next ? { insetInlineEnd: "1rem" } : { insetInlineStart: "1rem" }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        className={`h-5 w-5 ${dir === "rtl" ? "rotate-180" : ""}`}
      >
        {next ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
      </svg>
    </button>
  )
}

export function HeroCarousel() {
  const { d, dir } = useI18n()
  const slides = d.slides
  const count = Math.min(slides.length, IMAGES.length)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)

  const go = useCallback((i: number) => {
    setIndex(((i % count) + count) % count)
  }, [count])

  // autoplay timer
  useEffect(() => {
    if (paused || count < 2) return
    const id = setTimeout(() => go(index + 1), AUTOPLAY_MS)
    return () => clearTimeout(id)
  }, [index, paused, count, go])

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) < 40) return
    // mirror swipe in RTL
    const step = dir === "rtl" ? (dx > 0 ? 1 : -1) : dx > 0 ? -1 : 1
    go(index + step)
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-[#121212]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative h-[420px] sm:h-[480px] lg:h-[540px]">
        {IMAGES.slice(0, count).map((src, i) => {
          const s = slides[i]
          const active = i === index
          return (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-700 ${active ? "z-10 opacity-100" : "z-0 opacity-0"}`}
              aria-hidden={!active}
            >
              <Image
                src={src}
                alt={s.title}
                loading={i === 0 ? "eager" : "lazy"}
                priority={i === 0}
                fill
                sizes="100vw"
                className={`object-cover transition-transform duration-[6000ms] ${active ? "scale-105" : "scale-100"}`}
              />
              {/* overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#121212]/90 via-[#121212]/45 to-transparent rtl:bg-gradient-to-l rtl:from-[#121212]/90 rtl:via-[#121212]/45 rtl:to-transparent" />

              <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-6 sm:px-10 lg:px-16">
                <div className={`max-w-xl ${active ? "animate-[fadeSlide_0.5s_ease]" : ""}`}>
                  <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-[#E51D25] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-white">
                    {s.badge}
                  </p>
                  <h2 className="text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[54px]">
                    {s.title}
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                    {s.sub}
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <Link
                      href={s.href}
                      tabIndex={active ? 0 : -1}
                      className="inline-flex items-center gap-2 rounded-[4px] bg-white px-8 py-3.5 text-sm font-extrabold tracking-widest text-[#121212] transition-all hover:bg-[#E51D25] hover:text-white active:scale-95"
                    >
                      {s.cta}
                      <span aria-hidden="true" className={dir === "rtl" ? "rotate-180" : ""}>→</span>
                    </Link>
                    <span className="hidden rounded-full border border-white/30 px-3 py-1.5 text-[11px] font-bold text-white/80 sm:inline">
                      {index + 1} / {count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        <CarouselArrow next={false} dir={dir} onGo={() => go(index - 1)} />
        <CarouselArrow next dir={dir} onGo={() => go(index + 1)} />
      </div>

      {/* dots */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {IMAGES.slice(0, count).map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => go(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === index ? "w-8 bg-[#E51D25]" : "w-2.5 bg-white/60 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
