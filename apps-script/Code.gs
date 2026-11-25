/**
 * Daily Scoop — student summaries & teacher feedback.
 * Paste this whole file into Extensions → Apps Script of a Google Sheet owned by the teacher,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * The teacher page in the site fills in TEACHER_KEY for you.
 */
const TEACHER_KEY = '__TEACHER_KEY__'
const SHEET_NAME = '요약 제출'
const HEADERS = ['id', 'submittedAt', 'studentId', 'name', 'class', 'articleId', 'articleTitle', 'articleDay', 'summary', 'feedback', 'feedbackAt']
const MAX_ROWS = 20000

function doGet() {
  return json({ ok: true, service: 'daily-scoop-summaries' })
}

function doPost(e) {
  let req
  try { req = JSON.parse(e.postData.contents) } catch (err) { return json({ ok: false, error: 'bad_request' }) }
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const sheet = getSheet()
    switch (req.action) {
      case 'submit': return json(submit(sheet, req))
      case 'mine': {
        const studentId = validId(req.studentId)
        if (!studentId) return json({ ok: false, error: 'bad_student' })
        return json({ ok: true, items: readRows(sheet).filter(r => r.studentId === studentId).map(withoutStudentId) })
      }
      case 'list':
        if (!isTeacher(req)) return json({ ok: false, error: 'denied' })
        return json({ ok: true, items: readRows(sheet).map(withoutStudentId) })
      case 'comment':
        if (!isTeacher(req)) return json({ ok: false, error: 'denied' })
        return json(comment(sheet, req))
      case 'ping':
        return json({ ok: isTeacher(req) })
      default:
        return json({ ok: false, error: 'unknown_action' })
    }
  } finally {
    lock.releaseLock()
  }
}

function submit(sheet, req) {
  const studentId = validId(req.studentId)
  const name = text(req.name, 40)
  const summary = text(req.summary, 3000)
  const articleId = text(req.articleId, 100)
  if (!studentId || !name || !articleId || summary.length < 5) return { ok: false, error: 'missing_fields' }
  const now = new Date().toISOString()
  const rows = readRows(sheet)
  const existing = rows.find(r => r.studentId === studentId && r.articleId === articleId)
  if (existing) {
    // Re-submitting replaces the summary; earlier feedback stays visible until the teacher replies again.
    sheet.getRange(existing.row, 2, 1, 1).setValue(now)
    sheet.getRange(existing.row, 4, 1, 2).setValues([[safe(name), safe(text(req.className, 20))]])
    sheet.getRange(existing.row, 9, 1, 1).setValue(safe(summary))
    return { ok: true, id: existing.id, submittedAt: now, updated: true }
  }
  if (sheet.getLastRow() > MAX_ROWS) return { ok: false, error: 'full' }
  const id = Utilities.getUuid()
  sheet.appendRow([id, now, studentId, safe(name), safe(text(req.className, 20)), safe(articleId), safe(text(req.articleTitle, 200)), safe(text(req.articleDay, 20)), safe(summary), '', ''])
  return { ok: true, id: id, submittedAt: now }
}

function comment(sheet, req) {
  const row = readRows(sheet).find(r => r.id === String(req.id || ''))
  if (!row) return { ok: false, error: 'not_found' }
  const feedback = text(req.feedback, 2000)
  const at = feedback ? new Date().toISOString() : ''
  sheet.getRange(row.row, 10, 1, 2).setValues([[safe(feedback), at]])
  return { ok: true, feedbackAt: at }
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = book.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME)
    sheet.appendRow(HEADERS)
    sheet.setFrozenRows(1)
  }
  return sheet
}

function readRows(sheet) {
  const values = sheet.getDataRange().getValues()
  return values.slice(1).map((v, i) => {
    const r = { row: i + 2 }
    HEADERS.forEach((h, j) => { r[h] = v[j] instanceof Date ? v[j].toISOString() : String(v[j] == null ? '' : v[j]) })
    return r
  }).filter(r => r.id)
}

function withoutStudentId(r) {
  return { id: r.id, submittedAt: r.submittedAt, name: r.name, className: r.class, articleId: r.articleId, articleTitle: r.articleTitle, articleDay: r.articleDay, summary: r.summary, feedback: r.feedback, feedbackAt: r.feedbackAt }
}

function isTeacher(req) {
  return TEACHER_KEY.length >= 20 && TEACHER_KEY.indexOf('__') !== 0 && req.key === TEACHER_KEY
}

function validId(value) {
  const id = String(value || '')
  return /^[A-Za-z0-9-]{16,64}$/.test(id) ? id : ''
}

function text(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max)
}

// Keep student text from being read as a spreadsheet formula.
function safe(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON)
}
