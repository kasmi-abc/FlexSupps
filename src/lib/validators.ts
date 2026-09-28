export function sanitizeText(input: string, maxLen = 80): string {
  return input.replace(/[<>]/g, "").trim().slice(0, maxLen)
}

export function isValidPhone(phone: string): boolean {
  return /^0(5|6|7)[0-9]{8}$/.test(phone.replace(/\s/g, ""))
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === "https:" && /\.(jpg|jpeg|png|webp|avif)$/i.test(u.pathname)
  } catch { return false }
}

export function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 100 && price <= 500000
}

export function isValidStock(stock: number): boolean {
  return Number.isInteger(stock) && stock >= 0 && stock <= 10000
}

export function validatePromoCode(code: string): boolean {
  return /^[A-Z0-9]{3,12}$/.test(code.toUpperCase())
}

export function clampBmiInput(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min
  return Math.min(max, Math.max(min, v))
}