import type { Term } from './data'
export const TERMS: Term[]
export function termPattern(term: string): RegExp
export function extractTerms(text: string, limit?: number): Term[]
