export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ")
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-DZ").format(price) + " دج"
}

export function calcDiscount(price: number, compareAtPrice?: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return 0
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}

export const SHIPPING_THRESHOLD = 10000
export const SHIPPING_FEE = 500
export function getShipping(total: number): number {
  return total >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
}

// rate limit
const lastCall = new Map<string, number>()
export function isRateLimited(key: string, ms = 1000): boolean {
  const now = Date.now()
  const last = lastCall.get(key) || 0
  if (now - last < ms) return true
  lastCall.set(key, now)
  return false
}