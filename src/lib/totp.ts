// RFC6238 TOTP, WebCrypto
function base32Decode(input: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "")
  let bits = ""
  for (const ch of clean) {
    bits += alphabet.indexOf(ch).toString(2).padStart(5, "0")
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return new Uint8Array(bytes)
}

function randomBase32(length = 20): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const buf = new Uint8Array(length)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => alphabet[b % 32]).join("")
}

async function hotp(secret: string, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    base32Decode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  )
  const msg = new ArrayBuffer(8)
  const view = new DataView(msg)
  view.setUint32(0, Math.floor(counter / 0x100000000))
  view.setUint32(4, counter >>> 0)
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg))
  const offset = sig[sig.length - 1] & 0x0f
  const code =
    ((sig[offset] & 0x7f) << 24) |
    (sig[offset + 1] << 16) |
    (sig[offset + 2] << 8) |
    sig[offset + 3]
  return (code % 1_000_000).toString().padStart(6, "0")
}

export async function totpVerify(secret: string, code: string, window = 1): Promise<boolean> {
  const clean = code.replace(/\D/g, "")
  if (clean.length !== 6) return false
  const step = Math.floor(Date.now() / 30_000)
  for (let d = -window; d <= window; d++) {
    if ((await hotp(secret, step + d)) === clean) return true
  }
  return false
}

export function totpSecret(): string {
  return randomBase32(20)
}

export function totpUri(secret: string, account: string, issuer = "Flex Supps"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}
