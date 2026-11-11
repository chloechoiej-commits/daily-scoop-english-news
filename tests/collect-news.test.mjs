import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseCandidates, estimateLevel, excerptRow, headlineKey, toCandidate } from '../scripts/collect-news.mjs'

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
