import test from 'node:test'
import assert from 'node:assert/strict'
import { lockToken, unlockToken } from '../src/teacher-auth.mjs'

test('token is only recoverable with the right password', async () => {
  const box = await lockToken('github_pat_secret', 'correct horse', 1000)
  assert.ok(!JSON.stringify(box).includes('github_pat_secret'))
  assert.equal(await unlockToken(box, 'correct horse'), 'github_pat_secret')
  await assert.rejects(() => unlockToken(box, 'wrong password'), /비밀번호가 맞지 않아요/)
  await assert.rejects(() => lockToken('t', 'short'), /8자 이상/)
})
