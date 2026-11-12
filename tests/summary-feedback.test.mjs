import test from 'node:test'
import assert from 'node:assert/strict'
import { createSummaryFeedback } from '../src/summary-feedback.mjs'

const article = {
  title: 'A young helper in the garden',
  title_ko: '정원에서 이웃을 돕는 소년',
  content: 'Jeremiah helps at a community garden. He plants vegetables for neighbors.',
  summary: '제러마이어는 공동체 정원에서 채소를 기르며 이웃을 돕습니다.',
  words: [{ word: 'community' }, { word: 'garden' }, { word: 'c++' }],
}

test('empty input has no feedback', () => {
  assert.equal(createSummaryFeedback(' \n ', article), null)
})

test('checks relevant vocabulary, basic grammar and shared article terms', () => {
  const feedback = createSummaryFeedback('He go to the community garden', article)
  assert.match(feedback.vocabulary, /community/)
  assert.match(feedback.vocabulary, /garden/)
  assert.match(feedback.grammar, /3인칭/)
  assert.match(feedback.grammar, /문장 부호/)
  assert.match(feedback.keyPoints, /garden/)
})

test('does not claim valid grammar means all errors are absent', () => {
  const feedback = createSummaryFeedback('He plants vegetables in the garden.', article)
  assert.match(feedback.grammar, /직접 확인/)
})

test('handles Korean input and missing Korean comparison material honestly', () => {
  const feedback = createSummaryFeedback('공동체 정원에서 이웃을 돕습니다.', article)
  assert.match(feedback.vocabulary, /한국어/)
  assert.match(feedback.grammar, /채점하지 않아요/)
  assert.match(feedback.keyPoints, /정원/)
  const noReference = createSummaryFeedback('사람들이 나무를 심습니다.', { ...article, title_ko: '', summary: '' })
  assert.match(noReference.keyPoints, /비교 자료가 없어/)
})

test('reports unavailable vocabulary and treats text as plain text', () => {
  const feedback = createSummaryFeedback('A boy writes c++ in a garden.', { ...article, words: [] })
  assert.match(feedback.vocabulary, /등록된 학습 단어가 없어/)
  const escaped = createSummaryFeedback('A boy writes c++ in a garden.', article)
  assert.match(escaped.vocabulary, /c\+\+/)
})
