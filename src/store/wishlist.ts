"use client"
import { useState, useEffect, useCallback } from "react"

const KEY = "z1-wishlist"

function read(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") } catch { return [] }
}
function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids))
  window.dispatchEvent(new Event("wishlist-update"))
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>(() => read())

  useEffect(() => {
    const on = () => setIds(read())
    window.addEventListener("wishlist-update", on)
    window.addEventListener("storage", on)
    return () => {
      window.removeEventListener("wishlist-update", on)
      window.removeEventListener("storage", on)
    }
  }, [])

  const toggle = useCallback((id: string) => {
    const cur = read()
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
    write(next)
    setIds(next)
  }, [])

  const has = useCallback((id: string) => ids.includes(id), [ids])
  const count = ids.length

  return { ids, toggle, has, count }
}

export function toggleWishlistDirect(id: string) {
  const cur = read()
  const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
  write(next)
}