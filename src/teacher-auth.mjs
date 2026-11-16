// The repo write token is stored on the public site only in encrypted form.
// The teacher password derives the key (PBKDF2-SHA256), so the password never leaves the browser.
export const AUTH_FILE = 'public/data/teacher-auth.json'
export const MIN_PASSWORD = 8
const ITERATIONS = 600000

const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
const unb64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0))

async function deriveKey(password, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

export async function lockToken(token, password, iterations = ITERATIONS) {
  if (String(password).length < MIN_PASSWORD) throw new Error(`비밀번호는 ${MIN_PASSWORD}자 이상이어야 해요.`)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt, iterations)
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token))
  return { v: 1, kdf: 'PBKDF2-SHA256', iterations, salt: b64(salt), iv: b64(iv), data: b64(data) }
}

export async function unlockToken(box, password) {
  if (!box || box.v !== 1) throw new Error('선생님 로그인 설정이 아직 없어요.')
  try {
    const key = await deriveKey(password, unb64(box.salt), box.iterations)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.data))
    return new TextDecoder().decode(plain)
  } catch {
    throw new Error('비밀번호가 맞지 않아요.')
  }
}
