import { NextResponse } from "next/server"

// scraper UA gate, /api/* except health
const BAD_UA = [
  "python-requests",
  "scrapy",
  "go-http-client",
  "libwww-perl",
  "wget/",
  "curl/",
  "java/",
  "axios/",
  "postmanruntime",
  "phantomjs",
  "headless",
]

export default function proxy(req: Request) {
  const url = new URL(req.url)
  if (!url.pathname.startsWith("/api/") || url.pathname.startsWith("/api/health")) {
    return NextResponse.next()
  }
  const ua = (req.headers.get("user-agent") || "").toLowerCase()
  if (!ua || BAD_UA.some((b) => ua.includes(b))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
