import bcrypt from "bcryptjs"
import { signJwt, verifyJwt } from "@/lib/jwt-edge"

const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "change-me-32chars"
const COOKIE_NAME = "z1_admin_token"
const MAX_AGE = 12 * 60 * 60 // Admin session lifetime

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function signAdminToken(payload: { username: string }) {
  const now = Math.floor(Date.now() / 1000)
  return signJwt({ username: payload.username, role: "admin", iat: now, exp: now + MAX_AGE }, SECRET)
}

export async function verifyAdminToken(token: string): Promise<{ username: string } | null> {
  const payload = await verifyJwt(token, SECRET)
  if (!payload || payload.role !== "admin" || typeof payload.username !== "string") return null
  return { username: payload.username as string }
}

export function getAuthCookieName() {
  return COOKIE_NAME
}

const PRE_COOKIE = "z1_pre_auth"
const PRE_AGE = 5 * 60 // Pre-auth window

export async function signPreToken(username: string) {
  const now = Math.floor(Date.now() / 1000)
  return signJwt({ username, role: "pre", iat: now, exp: now + PRE_AGE }, SECRET)
}

export async function verifyPreToken(token: string): Promise<{ username: string } | null> {
  const payload = await verifyJwt(token, SECRET)
  if (!payload || payload.role !== "pre" || typeof payload.username !== "string") return null
  return { username: payload.username as string }
}

export function getPreCookieName() {
  return PRE_COOKIE
}

export function getPreCookieMaxAge() {
  return PRE_AGE
}

export function getAuthCookieMaxAge() {
  return MAX_AGE
}

export function isValidUsername(u: string): boolean {
  return /^[a-zA-Z0-9_]{3,32}$/.test(u)
}