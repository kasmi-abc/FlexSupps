import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  signAdminToken, getAuthCookieName, getAuthCookieMaxAge,
  verifyPreToken, getPreCookieName,
} from "@/lib/auth"
import { totpVerify, totpSecret, totpUri } from "@/lib/totp"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security"
import { logAlert, adminActor } from "@/lib/alerts"
import { cookies } from "next/headers"
import { z } from "zod"
import QRCode from "qrcode"

async function authedUsername(): Promise<string | null> {
  const cookieStore = await cookies()
  const { verifyAdminToken } = await import("@/lib/auth")
  const token = cookieStore.get(getAuthCookieName())?.value
  if (!token) return null
  const payload = await verifyAdminToken(token)
  return payload?.username || null
}

// GET /api/auth/2fa status (admin)
export async function GET() {
  const username = await authedUsername()
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const admin = await prisma.adminUser.findUnique({ where: { username } })
  return NextResponse.json({ enabled: !!admin?.totpEnabled })
}

// POST /api/auth/2fa setup|enable|verify|disable
export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = await rateLimit(`2fa:${ip}`, 10, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const action = z.string().parse(body.action || "")

  if (action === "verify") {
    const cookieStore = await cookies()
    const pre = cookieStore.get(getPreCookieName())?.value
    const payload = pre ? await verifyPreToken(pre) : null
    if (!payload) return NextResponse.json({ error: "Session expired, login again" }, { status: 401 })
    const admin = await prisma.adminUser.findUnique({ where: { username: payload.username } })
    if (!admin?.totpEnabled || !admin.totpSecret) {
      return NextResponse.json({ error: "2FA not enabled" }, { status: 400 })
    }
    const code = z.string().parse(body.code || "")
    if (!(await totpVerify(admin.totpSecret, code))) {
      logAlert("audit", "admin:2fa-fail", `Bad 2FA code for ${payload.username}`, { ip })
      return NextResponse.json({ error: "Invalid code" }, { status: 401 })
    }
    const token = await signAdminToken({ username: payload.username })
    const res = NextResponse.json({ success: true, username: payload.username })
    res.cookies.set(getAuthCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getAuthCookieMaxAge(),
    })
    res.cookies.set(getPreCookieName(), "", { httpOnly: true, path: "/", maxAge: 0 })
    logAlert("audit", "admin:2fa-ok", `2FA passed: ${payload.username}`, { ip })
    return res
  }

  // mutations require full session
  const username = await authedUsername()
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (action === "setup") {
    const secret = totpSecret()
    const uri = totpUri(secret, username)
    const qr = await QRCode.toDataURL(uri)
    return NextResponse.json({ secret, qr })
  }

  if (action === "enable") {
    const parsed = z.object({ code: z.string(), secret: z.string().min(16) }).safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
    if (!(await totpVerify(parsed.data.secret, parsed.data.code))) {
      return NextResponse.json({ error: "Invalid code, try again" }, { status: 400 })
    }
    await prisma.adminUser.update({
      where: { username },
      data: { totpSecret: parsed.data.secret, totpEnabled: true },
    })
    logAlert("audit", "admin:2fa-enable", `2FA enabled by ${username}`, { by: await adminActor() })
    return NextResponse.json({ success: true })
  }

  if (action === "disable") {
    const admin = await prisma.adminUser.findUnique({ where: { username } })
    const code = z.string().parse(body.code || "")
    if (!admin?.totpSecret || !(await totpVerify(admin.totpSecret, code))) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 })
    }
    await prisma.adminUser.update({
      where: { username },
      data: { totpSecret: null, totpEnabled: false },
    })
    logAlert("audit", "admin:2fa-disable", `2FA disabled by ${username}`, { by: await adminActor() })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
