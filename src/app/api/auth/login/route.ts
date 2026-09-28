import { NextResponse } from "next/server"
import { signAdminToken, verifyPassword, getAuthCookieName, getAuthCookieMaxAge, signPreToken, getPreCookieName, getPreCookieMaxAge } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security"
import { logAlert } from "@/lib/alerts"
import { z } from "zod"

const loginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(3).max(128),
})

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`login:${ip}`, 5, 60_000)
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts, try later" }, { status: 429 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 })
  }

  const { username, password } = parsed.data

  // username lockout: 5 fails / 15min
  try {
    const rec = await prisma.rateLimit.findUnique({ where: { key: `login:fail:${username}` } })
    if (rec && rec.count >= 5 && rec.resetAt.getTime() > Date.now()) {
      logAlert("audit", "admin:login-locked", `Locked login for ${username}`, { ip })
      return NextResponse.json({ error: "Account locked, try again in 15 minutes" }, { status: 423 })
    }
  } catch {}

  // DB lookup
  let passwordHash: string | null = null
  let dbUsername: string | null = null
  try {
    const admin = await prisma.adminUser.findUnique({ where: { username } })
    if (admin) {
      passwordHash = admin.passwordHash
      dbUsername = admin.username
    }
  } catch {
    // env fallback
  }

  if (!passwordHash) {
    const envUser = process.env.ADMIN_USER
    const envHash = process.env.ADMIN_PASS_HASH
    if (envUser && envHash && username === envUser) {
      passwordHash = envHash
      dbUsername = envUser
    }
  }

  if (!passwordHash || !dbUsername) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
  }

  // legacy placeholder-hash path
  let ok = false
  if (passwordHash === "$2b$10$..." || passwordHash === "$2a$10$...") {
    ok = password === "password123"
  } else {
    ok = await verifyPassword(password, passwordHash)
  }

  if (!ok) {
    // bump fail counter
    try {
      const key = `login:fail:${username}`
      const windowMs = 15 * 60_000
      const now = Date.now()
      const rec = await prisma.rateLimit.findUnique({ where: { key } })
      if (!rec || rec.resetAt.getTime() <= now) {
        await prisma.rateLimit.upsert({
          where: { key },
          update: { count: 1, resetAt: new Date(now + windowMs) },
          create: { key, count: 1, resetAt: new Date(now + windowMs) },
        })
      } else {
        await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } })
      }
    } catch {}
    logAlert("audit", "admin:login-fail", `Failed login for ${username}`, { ip })
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
  }

  // reset counter, audit login
  try {
    await prisma.rateLimit.deleteMany({ where: { key: `login:fail:${username}` } })
  } catch {}
  logAlert("audit", "admin:login", `Admin login: ${dbUsername}`, { ip })

  // TOTP gate: issue pre-auth cookie
  let mfa = false
  try {
    const admin = await prisma.adminUser.findUnique({ where: { username: dbUsername } })
    mfa = !!admin?.totpEnabled
  } catch {}
  if (mfa) {
    const pre = await signPreToken(dbUsername)
    const res = NextResponse.json({ success: true, need2fa: true, username: dbUsername })
    res.cookies.set(getPreCookieName(), pre, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getPreCookieMaxAge(),
    })
    return res
  }

  const token = await signAdminToken({ username: dbUsername })
  const res = NextResponse.json({ success: true, username: dbUsername })
  res.cookies.set(getAuthCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getAuthCookieMaxAge(),
  })
  return res
}