import test from 'node:test'
import assert from 'node:assert/strict'
import { translationParagraphs } from '../src/translation.mjs'

test('translation paragraphs preserve the text without substituting a summary', () => {
  assert.deepEqual(translationParagraphs(' 첫 문단입니다.\n\n두 번째 문단입니다.\n'), ['첫 문단입니다.', '두 번째 문단입니다.'])
  assert.deepEqual(translationParagraphs('  \n  '), [])
  assert.deepEqual(translationParagraphs(undefined), [])
  assert.deepEqual(translationParagraphs(null), [])
})
