import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyAdminToken, getAuthCookieName } from "@/lib/auth"
import { AdminShell } from "@/components/AdminShell"

// server gate
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const token = store.get(getAuthCookieName())?.value
  if (!token || !(await verifyAdminToken(token))) redirect("/admin/login")
  return <AdminShell>{children}</AdminShell>
}
