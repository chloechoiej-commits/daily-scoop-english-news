import test from 'node:test'
import assert from 'node:assert/strict'
import { articleText, teaser, upgradeArchive, READABLE_WORDS, pickDaily, KEEP_DAYS, articleId, mergeIntoArchive, seoulDay, CATEGORIES, categoryFor, chooseCandidates, estimateLevel, excerptRow, generateLearning, headlineKey, toCandidate } from '../scripts/collect-news.mjs'

const feed = { source: 'Example', host: 'example.org' }
const now = new Date('2026-11-11T00:00:00Z')
const item = { title: 'A Garden Grows', link: 'https://example.org/news/?tracking=1', isoDate: '2026-11-10T00:00:00Z', contentSnippet: 'Students grow flowers for their community.' }

test('validates dates, domains and unsuitable keywords', () => {
  assert.equal(toCandidate(item, feed, now).source_url, 'https://example.org/news/')
  assert.equal(toCandidate({ ...item, link: 'https://other.org/' }, feed, now), null)
  assert.equal(toCandidate({ ...item, isoDate: '2026-11-12T00:00:00Z' }, feed, now), null)
  assert.equal(toCandidate({ ...item, isoDate: '2026-07-01T00:00:00Z' }, feed, now), null)
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

test('classifies stories by whole words and feed categories', () => {
  assert.equal(categoryFor('Students start a new club at school'), '생활')
  assert.equal(categoryFor('NASA sends a rocket to the moon'), '과학')
  assert.equal(categoryFor('A museum shows art by young artists'), '문화')
  assert.equal(categoryFor('Sea turtles return to the ocean'), '환경')
  assert.equal(categoryFor('Leaders vote on a new law'), '세상')
  assert.equal(categoryFor('A big day', ['Sports']), '문화')
})

test('picks one story per section before doubling up', () => {
  const day = (n) => `2026-11-${String(n).padStart(2, '0')}T00:00:00Z`
  const make = (title, category, n) => ({ title, description: title, source: 'Example', source_url: `https://example.org/${n}`, date: new Date(day(n)), category })
  const items = [make('Science one', '과학', 10), make('Science two', '과학', 9), make('Science three', '과학', 8), make('Nature', '환경', 3), make('School', '생활', 4), make('Art', '문화', 2), make('World', '세상', 1)]
  assert.deepEqual(chooseCandidates(items).map(i => i.category).sort(), [...CATEGORIES].sort())
  // A missing section is topped up from the others instead of leaving the day short.
  const noWorld = items.filter(i => i.category !== '세상')
  const picked = chooseCandidates(noWorld)
  assert.equal(picked.length, 5)
  assert.equal(picked.filter(i => i.category === '과학').length, 2)
  // Sections already collected today are skipped on a re-run.
  assert.deepEqual(chooseCandidates(items, [], [], 2, ['환경', '과학', '생활']).map(i => i.category).sort(), ['문화', '세상'].sort())
})

test('keeps the whole summary when the feed has no full article', () => {
  const long = 'Students plant a garden. '.repeat(20).trim()
  const candidate = toCandidate({ ...item, contentSnippet: long }, feed, now)
  const row = excerptRow(candidate, '2026-11-11')
  assert.equal(row.content, long)
  assert.ok(!row.content.includes('…') && !row.excerpt.includes('…'))
  assert.equal(row.content_kind, 'rss_excerpt')
  assert.equal(row.source, 'Example')
  assert.equal(row.collection_day, '2026-11-11')
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
  assert.equal(saved.content, row.content, 'AI must not rewrite the article')
  delete result.translation_ko
  await assert.rejects(() => generateLearning(row, candidate, 'test-key'), /missing required learning fields/)
})

test('static archive keeps new rows first and drops old ones', () => {
  const now = new Date('2026-11-16T00:00:00Z')
  const old = { id: 'old', title: 'Old', source_url: 'https://example.org/old', collection_day: '2026-01-01' }
  const recent = { id: 'recent', title: 'Recent', source_url: 'https://example.org/recent', collection_day: '2026-11-15' }
  const merged = mergeIntoArchive([recent, old], [{ title: 'New', source_url: 'https://example.org/new', collection_day: '2026-11-16' }], '2026-11-16', now)
  assert.deepEqual(merged.map(a => a.title), ['New', 'Recent'])
  assert.equal(merged[0].id, articleId('https://example.org/new'))
  assert.ok(KEEP_DAYS >= 30)
  assert.equal(seoulDay(new Date('2026-11-15T23:30:00Z')), '2026-11-16')
})

test('fills the day with older unseen stories when fresh ones run out', () => {
  const now = new Date('2026-11-16T00:00:00Z')
  const make = (title, category, date) => ({ title, description: title, source: 'Example', source_url: `https://example.org/${title}`, date: new Date(date), category })
  const items = [make('fresh-sci', '과학', '2026-11-10'), make('fresh-env', '환경', '2026-11-12'), make('old-life', '생활', '2026-09-20'), make('old-art', '문화', '2026-09-10'), make('old-world', '세상', '2026-09-01'), make('old-sci', '과학', '2026-09-02')]
  const picked = pickDaily(items, [], [], 5, [], now)
  assert.equal(picked.length, 5)
  assert.deepEqual(picked.slice(0, 2).map(i => i.title).sort(), ['fresh-env', 'fresh-sci'])
  assert.deepEqual(picked.map(i => i.category).sort(), ['과학', '문화', '생활', '세상', '환경'].sort())
})

test('uses the full article from content:encoded, without title or promos', () => {
  const body = Array.from({ length: 8 }, (_, i) => `<p>Paragraph ${i} tells students about the new park and its many plants.</p>`).join('')
  const html = `<h2>A Garden Grows</h2>${body}<p>Do you have a science question? We can help!</p><figure><img src="x.jpg"><figcaption>Photo</figcaption></figure>`
  const candidate = toCandidate({ ...item, 'content:encoded': html }, feed, now)
  const row = excerptRow(candidate, '2026-11-11')
  assert.equal(row.content_kind, 'rss_full')
  assert.equal(row.content.split('\n\n').length, 8)
  assert.ok(row.content.startsWith('Paragraph 0'))
  assert.ok(!/science question|Photo|A Garden Grows/.test(row.content))
  assert.ok(row.reading_minutes >= 1)
  assert.equal(articleText('<p>A Garden Grows</p><p>Body.</p>', 'A Garden Grows'), 'Body.')
})

test('teasers end on a full sentence', () => {
  assert.equal(teaser('One. Two. ' + 'Long sentence goes here. '.repeat(20)), 'One. Two. Long sentence goes here. Long sentence goes here. Long sentence goes here. Long sentence goes here. Long sentence goes here. Long sentence goes here. Long sentence goes here.')
})

test('prefers a readable-length story within a section', () => {
  const make = (title, words, d) => ({ title, source_url: `https://example.org/${title}`, date: new Date(d), category: '과학', words })
  const picked = chooseCandidates([make('long-new', READABLE_WORDS + 500, '2026-11-12'), make('short-old', 300, '2026-11-10')], [], [], 1)
  assert.equal(picked[0].title, 'short-old')
})

test('upgrades earlier cut-off excerpts to full text', () => {
  const html = Array.from({ length: 8 }, () => '<p>The new park has many plants and animals for students to see.</p>').join('')
  const candidate = toCandidate({ ...item, 'content:encoded': html }, feed, now)
  const old = { ...excerptRow({ ...candidate, content: candidate.description, fullText: false }, '2026-11-10'), content: 'Students grow…' }
  const { archive, changed } = upgradeArchive([old], [candidate])
  assert.equal(changed, 1)
  assert.equal(archive[0].content_kind, 'rss_full')
  assert.equal(archive[0].collection_day, '2026-11-10')
})

test('restores paragraphs and subheadings from flattened feed text', () => {
  const flat = '<p>Weather<br />Step outside. It might be sunny. That is the weather. Temperature<br />This is how hot the air is. Wind<br />Air moves.</p>'
  assert.deepEqual(articleText(flat, 'Weather').split('\n\n'), ['Step outside. It might be sunny. That is the weather.', 'Temperature', 'This is how hot the air is.', 'Wind', 'Air moves.'])
  const long = '<p>' + 'Sophia gives away many books to kids. '.repeat(40) + '</p>'
  const parts = articleText(long).split('\n\n')
  assert.ok(parts.length >= 4)
  assert.equal(parts.join(' '), ('Sophia gives away many books to kids. '.repeat(40)).trim())
})
