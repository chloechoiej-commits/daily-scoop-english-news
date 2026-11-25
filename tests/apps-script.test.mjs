import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const KEY = 'k'.repeat(48)

// Minimal in-memory stand-ins for the Google services Code.gs uses.
function loadScript() {
  const rows = []
  const sheet = {
    appendRow: r => rows.push([...r]), setFrozenRows() {}, getLastRow: () => rows.length,
    getDataRange: () => ({ getValues: () => rows.map(r => [...r]) }),
    getRange: (row, col, nr, nc) => ({
      setValue: v => { rows[row - 1][col - 1] = v },
      setValues: vs => vs[0].forEach((v, i) => { rows[row - 1][col - 1 + i] = v }),
    }),
  }
  let created = false
  let uuid = 0
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => created ? sheet : null, insertSheet: () => { created = true; return sheet } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { getUuid: () => `id-${++uuid}` },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
  }
  vm.createContext(ctx)
  vm.runInContext(readFileSync('apps-script/Code.gs', 'utf8').replace('__TEACHER_KEY__', KEY), ctx)
  const post = body => ctx.doPost({ postData: { contents: JSON.stringify(body) } })
  return { post, rows }
}

const student = 'student-aaaaaaaaaaaaaaaa'
const submit = (extra = {}) => ({ action: 'submit', studentId: student, name: '민지', className: '2-3', articleId: 'rss-1', articleTitle: 'Towering Spires', articleDay: '2026-11-25', summary: 'A new park in Arizona.', ...extra })

test('students submit, re-submit, and only see their own summaries', () => {
  const { post, rows } = loadScript()
  assert.equal(post(submit()).ok, true)
  assert.equal(post(submit({ summary: 'A new national park in Arizona.' })).updated, true)
  assert.equal(rows.length, 2, 'header + one row; re-submitting replaces')
  post(submit({ studentId: 'other-bbbbbbbbbbbbbbbbbb', name: '준호' }))
  const mine = post({ action: 'mine', studentId: student })
  assert.equal(mine.items.length, 1)
  assert.equal(mine.items[0].summary, 'A new national park in Arizona.')
  assert.equal(mine.items[0].studentId, undefined)
  assert.equal(post({ action: 'mine', studentId: '' }).ok, false)
})

test('only the teacher key can list and comment', () => {
  const { post } = loadScript()
  const { id } = post(submit())
  assert.equal(post({ action: 'list', key: 'wrong' }).ok, false)
  assert.equal(post({ action: 'comment', key: 'wrong', id, feedback: 'x' }).ok, false)
  assert.equal(post({ action: 'ping', key: KEY }).ok, true)
  assert.equal(post({ action: 'list', key: KEY }).items.length, 1)
  assert.equal(post({ action: 'comment', key: KEY, id, feedback: '핵심을 잘 잡았어요!' }).ok, true)
  const mine = post({ action: 'mine', studentId: student }).items[0]
  assert.equal(mine.feedback, '핵심을 잘 잡았어요!')
  assert.ok(mine.feedbackAt)
})

test('rejects incomplete submissions and neutralises spreadsheet formulas', () => {
  const { post, rows } = loadScript()
  assert.equal(post(submit({ name: '' })).ok, false)
  assert.equal(post(submit({ summary: 'hi' })).ok, false)
  post(submit({ name: '=IMPORTXML("http://x")', summary: '=HYPERLINK("http://x")' }))
  assert.ok(rows[1][3].startsWith("'=") && rows[1][8].startsWith("'="))
})

test('an unconfigured script never accepts a teacher key', () => {
  const src = readFileSync('apps-script/Code.gs', 'utf8')
  assert.match(src, /const TEACHER_KEY = '__TEACHER_KEY__'/)
  assert.match(src, /indexOf\('__'\) !== 0/)
})
