import type { Article } from './data'
import type { TokenBox } from './teacher-auth.mjs'

// Teacher uploads are committed to this file in the repository; the push redeploys the site.
export const TEACHER_FILE = 'public/data/teacher-articles.json'
export const REPO = (import.meta.env.VITE_GITHUB_REPO as string | undefined) || 'chloechoiej-commits/daily-scoop-english-news'
const API = `https://api.github.com/repos/${REPO}`

const headers = (token: string) => ({ Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' })

function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text); let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}
const fromBase64 = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)))

async function failure(response: Response, fallback: string) {
  if (response.status === 401) return new Error('토큰이 올바르지 않거나 만료되었어요. 다시 로그인해 주세요.')
  if (response.status === 403 || response.status === 404) return new Error('이 토큰에는 저장소 쓰기 권한이 없어요. Contents: Read and write 권한을 확인해 주세요.')
  if (response.status === 409 || response.status === 422) return new Error('다른 곳에서 먼저 수정되었어요. 잠시 후 다시 시도해 주세요.')
  return new Error(`${fallback} (HTTP ${response.status})`)
}

/** Confirms the token can push to the site repository and returns the GitHub login. */
export async function verifyTeacher(token: string) {
  const [repo, user] = await Promise.all([fetch(API, { headers: headers(token) }), fetch('https://api.github.com/user', { headers: headers(token) })])
  if (!repo.ok) throw await failure(repo, '저장소를 확인하지 못했어요.')
  const info = await repo.json()
  if (!info.permissions?.push) throw new Error('이 계정은 저장소에 기사를 올릴 권한이 없어요.')
  return user.ok ? String((await user.json()).login || '') : ''
}

async function readJson<T>(token: string, path: string, fallback: T): Promise<{ data: T; sha?: string }> {
  const response = await fetch(`${API}/contents/${path}?ref=master&t=${Date.now()}`, { headers: headers(token), cache: 'no-store' })
  if (response.status === 404) return { data: fallback }
  if (!response.ok) throw await failure(response, '파일을 불러오지 못했어요.')
  const file = await response.json()
  return { data: JSON.parse(fromBase64(file.content || '') || 'null') ?? fallback, sha: file.sha }
}

async function writeJson(token: string, path: string, data: unknown, sha: string | undefined, message: string) {
  const response = await fetch(`${API}/contents/${path}`, {
    method: 'PUT', headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: toBase64(JSON.stringify(data, null, 1) + '\n'), sha, branch: 'master' }),
  })
  if (!response.ok) throw await failure(response, '저장하지 못했어요.')
  return (await response.json()).content?.sha as string
}

export async function readTeacherArticles(token: string): Promise<{ articles: Article[]; sha?: string }> {
  const { data, sha } = await readJson<Article[]>(token, TEACHER_FILE, [])
  return { articles: Array.isArray(data) ? data : [], sha }
}

export const writeTeacherArticles = (token: string, articles: Article[], sha: string | undefined, message: string) => writeJson(token, TEACHER_FILE, articles, sha, message)

/** Public read of the encrypted login box (no token needed). Raw GitHub is fresher than the deployed copy. */
export async function fetchAuthBox(siteBase: string, path: string): Promise<TokenBox | null> {
  for (const url of [`https://raw.githubusercontent.com/${REPO}/master/${path}?t=${Date.now()}`, `${siteBase}${path.replace(/^public\//, '')}?t=${Date.now()}`]) {
    try { const r = await fetch(url, { cache: 'no-store' }); if (r.ok) { const box = await r.json(); if (box?.v === 1) return box } } catch { /* try next */ }
  }
  return null
}

export async function saveAuthBox(token: string, path: string, box: TokenBox) {
  const { sha } = await readJson<unknown>(token, path, null)
  await writeJson(token, path, box, sha, 'Update teacher login')
}
