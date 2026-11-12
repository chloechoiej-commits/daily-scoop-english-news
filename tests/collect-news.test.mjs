import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseCandidates, estimateLevel, excerptRow, generateLearning, headlineKey, toCandidate } from '../scripts/collect-news.mjs'

const feed = { source: 'Example', host: 'example.org' }
const now = new Date('2026-11-11T00:00:00Z')
const item = { title: 'A Garden Grows', link: 'https://example.org/news/?tracking=1', isoDate: '2026-11-10T00:00:00Z', contentSnippet: 'Students grow flowers for their community.' }

test('validates dates, domains and unsuitable keywords', () => {
  assert.equal(toCandidate(item, feed, now).source_url, 'https://example.org/news/')
  assert.equal(toCandidate({ ...item, link: 'https://other.org/' }, feed, now), null)
  assert.equal(toCandidate({ ...item, isoDate: '2026-11-12T00:00:00Z' }, feed, now), null)
  assert.equal(toCandidate({ ...item, isoDate: '2026-10-01T00:00:00Z' }, feed, now), null)
  assert.equal(toCandidate({ ...item, title: 'Violence in a city' }, feed, now), null)
})

test('deduplicates URLs and headlines and respects remaining limit', () => {
  const first = toCandidate(item, feed, now)
  const second = toCandidate({ ...item, link: 'https://example.org/other/', title: 'A Garden Grows!' }, feed, now)
  const third = toCandidate({ ...item, link: 'https://example.org/third/', title: 'A Different Story' }, feed, now)
  assert.equal(headlineKey(first.title), headlineKey(second.title))
  assert.equal(chooseCandidates([first, second, third]).length, 2)
  assert.equal(chooseCandidates([first, second, third], [first.source_url], [first.title]).length, 1)
  assert.equal(chooseCandidates([first, third], [], [], 1).length, 1)
  assert.equal(chooseCandidates([first], [], [], 0).length, 0)
})

test('stores a short attributed excerpt, not the full article', () => {
  const candidate = toCandidate({ ...item, contentSnippet: 'A '.repeat(200) }, feed, now)
  const row = excerptRow(candidate, '2026-11-11')
  assert.ok(Array.from(row.content).length <= 180)
  assert.equal(row.content_kind, 'rss_excerpt')
  assert.equal(row.source, 'Example')
  assert.equal(row.collection_day, '2026-11-11')
  assert.deepEqual(row.words, [])
  assert.equal(estimateLevel('A cat can run. A dog can run.'), 'LEVEL 1')
})

test('AI collection saves a full translation rather than a summary', async t => {
  const candidate = toCandidate(item, feed, now)
  const row = excerptRow(candidate, '2026-11-11')
  const result = { title_ko: '정원', content: 'Students grow flowers. Bees visit them.', translation_ko: '학생들이 꽃을 기릅니다. 벌들이 꽃을 찾아옵니다.', summary: '학생들이 꽃을 기릅니다.', words: [{ word: 'grow', meaning: '기르다', example: 'Students grow flowers.' }], grammar: [{ title: '현재형', explanation: '현재의 일을 나타내요.', example: 'Students grow flowers.' }] }
  let prompt
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    prompt = JSON.parse(options.body).messages[0].content
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(result) } }] }), { status: 200 })
  })
  const saved = await generateLearning(row, candidate, 'test-key')
  assert.match(prompt, /translation_ko/)
  assert.equal(saved.translation_ko, result.translation_ko)
  assert.notEqual(saved.translation_ko, saved.summary)
  delete result.translation_ko
  await assert.rejects(() => generateLearning(row, candidate, 'test-key'), /missing required learning fields/)
})
