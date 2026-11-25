// Student summaries are stored in the teacher's Google Sheet through a small Apps Script web app
// (apps-script/Code.gs). The site only knows the web-app URL; reading everything needs the teacher key.
import { REPO } from './github'

export type Submission = {
  id: string; submittedAt: string; name: string; className: string
  articleId: string; articleTitle: string; articleDay: string
  summary: string; feedback: string; feedbackAt: string
}
export type FeedbackConfig = { v: 1; url: string; keyBox?: import('./teacher-auth.mjs').TokenBox }

export const CONFIG_FILE = 'public/data/feedback-config.json'
const STUDENT_KEY = 'scoop-student'

export type Student = { id: string; name: string; className: string }

export function loadStudent(): Student {
  try {
    const saved = JSON.parse(localStorage.getItem(STUDENT_KEY) || '{}')
    if (saved.id) return { id: saved.id, name: saved.name || '', className: saved.className || '' }
  } catch { /* fall through */ }
  const student = { id: crypto.randomUUID(), name: '', className: '' }
  saveStudent(student)
  return student
}
export function saveStudent(student: Student) { try { localStorage.setItem(STUDENT_KEY, JSON.stringify(student)) } catch { /* private mode */ } }

export const isWebAppUrl = (url: string) => /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url.trim())

export async function fetchFeedbackConfig(siteBase: string): Promise<FeedbackConfig | null> {
  for (const url of [`${siteBase}data/feedback-config.json?t=${Date.now()}`, `https://raw.githubusercontent.com/${REPO}/master/${CONFIG_FILE}?t=${Date.now()}`]) {
    try { const r = await fetch(url, { cache: 'no-store' }); if (r.ok) { const c = await r.json(); if (c?.v === 1 && isWebAppUrl(c.url || '')) return c } } catch { /* try next */ }
  }
  return null
}

// text/plain keeps this a "simple" request, which Apps Script answers without a CORS preflight.
async function call<T>(url: string, body: Record<string, unknown>): Promise<T> {
  let response: Response
  try { response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }) }
  catch { throw new Error('저장 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.') }
  if (!response.ok) throw new Error(`저장 서버 오류가 났어요. (HTTP ${response.status})`)
  const data = await response.json().catch(() => null)
  if (!data?.ok) {
    const code = data?.error
    throw new Error(code === 'denied' ? '선생님 키가 맞지 않아요. 연결 설정을 다시 확인해 주세요.' : code === 'missing_fields' ? '이름과 요약(5자 이상)을 입력해 주세요.' : code === 'full' ? '저장 공간이 가득 찼어요. 선생님께 알려 주세요.' : '요청을 처리하지 못했어요.')
  }
  return data as T
}

export const submitSummary = (url: string, student: Student, article: { id: string; title: string; day: string }, summary: string) =>
  call<{ id: string; submittedAt: string }>(url, { action: 'submit', studentId: student.id, name: student.name, className: student.className, articleId: article.id, articleTitle: article.title, articleDay: article.day, summary })

export const fetchMine = (url: string, studentId: string) => call<{ items: Submission[] }>(url, { action: 'mine', studentId }).then(r => r.items)
export const fetchAll = (url: string, key: string) => call<{ items: Submission[] }>(url, { action: 'list', key }).then(r => r.items)
export const saveComment = (url: string, key: string, id: string, feedback: string) => call<{ feedbackAt: string }>(url, { action: 'comment', key, id, feedback })
export const pingTeacher = (url: string, key: string) => call<{ ok: boolean }>(url, { action: 'ping', key })

export function newTeacherKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}
