// WebCrypto HS256 JWT
const enc = new TextEncoder()
const dec = new TextDecoder()

function b64urlEncode(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const b = s.replace(/-/g, "+").replace(/_/g, "/")
  const pad = b.length % 4
  const str = atob(b + (pad ? "=".repeat(4 - pad) : ""))
  const out = new Uint8Array(new ArrayBuffer(str.length))
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i)
  return out
}

function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

export async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const h = b64urlEncode(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))
  const b = b64urlEncode(enc.encode(JSON.stringify(payload)))
  const key = await importKey(secret)
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${h}.${b}`)))
  return `${h}.${b}.${b64urlEncode(sig)}`
}

export async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const [h, b, s] = parts
    const key = await importKey(secret)
    const ok = await crypto.subtle.verify("HMAC", key, b64urlDecode(s), enc.encode(`${h}.${b}`))
    if (!ok) return null
    const payload = JSON.parse(dec.decode(b64urlDecode(b))) as Record<string, unknown>
    if (typeof payload.exp === "number" && Math.floor(Date.now() / 1000) > payload.exp) return null
    return payload
  } catch {
    return null
  }
}
