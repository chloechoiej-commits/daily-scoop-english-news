import test from 'node:test'
import assert from 'node:assert/strict'
import { extractTerms, termPattern } from '../src/glossary.mjs'
import { extractWords } from '../src/learning.mjs'

const text = `The United States has a new national park. Erosion created hoodoos.
It was first a national monument. Doug Burgum is the U.S. Secretary of the Interior.
Some amoebas eat bacteria. The park protects its biodiversity.`

test('finds technical terms in order of appearance, with Korean notes', () => {
  const terms = extractTerms(text)
  assert.deepEqual(terms.map(t => t.term), ['national park', 'erosion', 'hoodoo', 'national monument', 'Secretary of the Interior', 'amoeba', 'bacteria', 'biodiversity'])
  for (const t of terms) assert.ok(/[가-힣]/.test(t.ko) && /[가-힣]/.test(t.note))
})

test('matches plurals and keeps proper nouns case-sensitive', () => {
  assert.match('three hoodoos', termPattern('hoodoo'))
  assert.match('Amoebas move', termPattern('amoeba'))
  assert.doesNotMatch('an apache helicopter', termPattern('Apache'))
  assert.doesNotMatch('the NBAX', termPattern('NBA'))
})

test('a longer phrase wins over a word inside it', () => {
  const terms = extractTerms('Proceedings of the National Academy of Sciences published it.')
  assert.equal(terms.length, 1)
})

test('technical terms are not repeated in the key-word list', () => {
  const words = extractWords(text).map(w => w.word)
  assert.ok(!words.includes('biodiversity') && !words.includes('erosion') && !words.includes('national'))
})
