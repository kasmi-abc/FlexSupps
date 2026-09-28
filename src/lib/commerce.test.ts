import { describe, it, expect } from "vitest"
import { formatPriceDz } from "@/i18n/dict"
import { calcDiscount, getShipping, SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/utils"
import {
  sanitizeText, isValidPhone, isValidUrl, isValidPrice,
  isValidStock, validatePromoCode, clampBmiInput,
} from "@/lib/validators"
import { totpVerify } from "@/lib/totp"

describe("pricing", () => {
  it("formats DA in French and دج in Arabic", () => {
    expect(formatPriceDz(14900, "fr")).toContain("DA")
    expect(formatPriceDz(14900, "ar")).toContain("دج")
  })
  it("computes discount percent", () => {
    expect(calcDiscount(75, 100)).toBe(25)
    expect(calcDiscount(100, 100)).toBe(0)
    expect(calcDiscount(100)).toBe(0)
  })
  it("free shipping over threshold", () => {
    expect(getShipping(SHIPPING_THRESHOLD)).toBe(0)
    expect(getShipping(SHIPPING_THRESHOLD - 1)).toBe(SHIPPING_FEE)
  })
})

describe("validators", () => {
  it("accepts DZ mobile numbers", () => {
    expect(isValidPhone("0673270872")).toBe(true)
    expect(isValidPhone("0555 98 76 54")).toBe(true)
    expect(isValidPhone("0412345678")).toBe(false)
    expect(isValidPhone("123")).toBe(false)
  })
  it("accepts https image urls only", () => {
    expect(isValidUrl("https://x.com/a.jpg")).toBe(true)
    expect(isValidUrl("https://x.com/a.avif")).toBe(true)
    expect(isValidUrl("http://x.com/a.jpg")).toBe(false)
    expect(isValidUrl("https://x.com/a.gif")).toBe(false)
  })
  it("bounds price and stock", () => {
    expect(isValidPrice(14900)).toBe(true)
    expect(isValidPrice(50)).toBe(false)
    expect(isValidStock(10)).toBe(true)
    expect(isValidStock(-1)).toBe(false)
  })
  it("validates promo codes", () => {
    expect(validatePromoCode("FIT10")).toBe(true)
    expect(validatePromoCode("fit10")).toBe(true)
    expect(validatePromoCode("AB")).toBe(false)
  })
  it("sanitizes text and clamps BMI inputs", () => {
    expect(sanitizeText("<b>x</b>")).toBe("bx/b")
    expect(clampBmiInput(500, 30, 300)).toBe(300)
    expect(clampBmiInput(NaN, 30, 300)).toBe(30)
  })
})

describe("totp", () => {
  it("rejects malformed codes without throwing", async () => {
    await expect(totpVerify("JBSWY3DPEHPK3PXP", "12")).resolves.toBe(false)
    await expect(totpVerify("JBSWY3DPEHPK3PXP", "abcdef")).resolves.toBe(false)
  })
})
