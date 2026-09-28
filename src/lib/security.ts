// same-origin mutation guard
export function isSameOrigin(req: Request): boolean {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
  const origin = req.headers.get("origin")
  const referer = req.headers.get("referer")
  if (!origin && !referer) return false
  try {
    if (origin) return new URL(origin).host === host
    return new URL(referer as string).host === host
  } catch {
    return false
  }
}
