"use client"
import { useEffect, useState } from "react"

export interface StoreSettings {
  shipping_threshold: number
  shipping_fee: number
  cod_enabled: boolean
  loyalty_enabled: boolean
}

const DEFAULTS: StoreSettings = {
  shipping_threshold: 10000,
  shipping_fee: 500,
  cod_enabled: true,
  loyalty_enabled: true,
}

export function useSettings(): StoreSettings {
  const [s, setS] = useState<StoreSettings>(DEFAULTS)
  useEffect(() => {
    const t = setTimeout(() => {
      fetch("/api/settings", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d?.settings) return
          setS({
            shipping_threshold: Number(d.settings.shipping_threshold) || DEFAULTS.shipping_threshold,
            shipping_fee: Number(d.settings.shipping_fee) || 0,
            cod_enabled: d.settings.cod_enabled !== "0",
            loyalty_enabled: d.settings.loyalty_enabled !== "0",
          })
        })
        .catch(() => {})
    }, 0)
    return () => clearTimeout(t)
  }, [])
  return s
}

export function getSessionId(): string {
  try {
    let id = localStorage.getItem("gog-session")
    if (!id) {
      id = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      localStorage.setItem("gog-session", id)
    }
    return id
  } catch {
    return `s-${Date.now().toString(36)}`
  }
}
