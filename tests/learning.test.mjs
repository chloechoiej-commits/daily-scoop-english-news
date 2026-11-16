import test from 'node:test'
import assert from 'node:assert/strict'
import { baseForms, extractGrammar, extractWords, withLearning, wordPattern } from '../src/learning.mjs'

const article = `Chiricahua was formed 27 million years ago. Volcanoes erupted. The volcanic ash cooled.

The park contains varied ecosystems. Many animals call the park home. Visitors can hike around these strange pillars.

Now it has been upgraded to a national park. Scientists who study the area say its biodiversity is extraordinary.`

test('finds key words with Korean meanings and an example from the article', () => {
  const words = extractWords(article)
  assert.ok(words.length >= 4)
  for (const w of words) {
    assert.ok(w.meaning && /[가-힣]/.test(w.meaning))
    assert.ok(article.includes(w.example), `${w.word} example is from the article`)
    assert.match(w.example, wordPattern(w.word))
  }
  assert.ok(words.some(w => w.word === 'extraordinary'))
  assert.ok(!words.some(w => w.word === 'biodiversity'), 'technical terms are annotated separately')
})

test('handles inflected forms', () => {
  assert.ok(baseForms('studies').includes('study'))
  assert.ok(baseForms('erupted').includes('erupt'))
  assert.ok(baseForms('planned').includes('plan'))
  assert.ok(baseForms('creating').includes('create'))
  assert.match('The volcanoes erupted.', wordPattern('erupt'))
  assert.match('She studied hard.', wordPattern('study'))
})

test('finds grammar points with distinct example sentences', () => {
  const grammar = extractGrammar(article)
  assert.deepEqual(grammar.map(g => g.title.split(' ')[0]), ['현재완료', '수동태', '관계대명사'])
  for (const g of grammar) assert.ok(g.example.includes(g.focus) && article.includes(g.example))
  assert.equal(new Set(grammar.map(g => g.example)).size, grammar.length)
})

test('keeps materials a teacher already wrote', () => {
  const mine = { content: article, words: [{ word: 'park', meaning: '공원', example: 'x' }], grammar: [] }
  const filled = withLearning(mine)
  assert.equal(filled.words, mine.words)
  assert.ok(filled.grammar.length > 0)
})
