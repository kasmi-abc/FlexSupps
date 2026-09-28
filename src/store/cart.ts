"use client"
import { useState, useEffect, useCallback } from "react"
import { CartItem } from "@/types"

// LS-synced cart

const CART_KEY = "supplement-cart"

function readCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]")
  } catch { return [] }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event("cart-update"))
}

export function useCartStore() {
  const [items, setItems] = useState<CartItem[]>(() => readCart())

  useEffect(() => {
    const onUpdate = () => setItems(readCart())
    const onStorage = (e: StorageEvent) => { if (e.key === CART_KEY) setItems(readCart()) }
    window.addEventListener("cart-update", onUpdate)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("cart-update", onUpdate)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const addItem = useCallback((item: CartItem) => {
    const current = readCart()
    const existing = current.find(i => i.variantId === item.variantId && i.isSubscription === item.isSubscription)
    const next = existing
      ? current.map(i => i.variantId === item.variantId && i.isSubscription === item.isSubscription ? { ...i, quantity: i.quantity + item.quantity } : i)
      : [...current, item]
    writeCart(next)
    setItems(next)
  }, [])

  const removeItem = useCallback((variantId: string, isSub?: boolean) => {
    const current = readCart()
    const next = current.filter(i => !(i.variantId === variantId && (isSub === undefined || i.isSubscription === isSub)))
    writeCart(next); setItems(next)
  }, [])

  const updateQuantity = useCallback((variantId: string, qty: number, isSub?: boolean) => {
    const current = readCart()
    let next: CartItem[]
    if (qty <= 0) {
      next = current.filter(i => !(i.variantId === variantId && (isSub === undefined || i.isSubscription === isSub)))
    } else {
      next = current.map(i => (i.variantId === variantId && (isSub === undefined || i.isSubscription === isSub) ? { ...i, quantity: qty } : i))
    }
    writeCart(next); setItems(next)
  }, [])

  const clearCart = useCallback(() => { writeCart([]); setItems([]) }, [])
  const total = () => items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = () => items.reduce((sum, i) => sum + i.quantity, 0)

  return { items, addItem, removeItem, updateQuantity, clearCart, total, count }
}

// Non-hook cart writer
export function addToCartDirect(item: CartItem) {
  const current = readCart()
  const existing = current.find(i => i.variantId === item.variantId && i.isSubscription === item.isSubscription)
  const next = existing
    ? current.map(i => i.variantId === item.variantId && i.isSubscription === item.isSubscription ? { ...i, quantity: i.quantity + item.quantity } : i)
    : [...current, item]
  writeCart(next)
}