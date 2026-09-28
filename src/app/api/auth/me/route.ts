import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAdminToken } from "@/lib/auth"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("z1_admin_token")?.value
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  const payload = await verifyAdminToken(token)
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({ authenticated: true, username: payload.username })
}