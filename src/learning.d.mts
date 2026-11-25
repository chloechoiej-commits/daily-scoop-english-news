import type { Article, Grammar, Word } from './data'
export const VOCAB: Record<string, string>
export function splitSentences(text: string): string[]
export function baseForms(word: string): string[]
export function wordPattern(base: string): RegExp
export function extractWords(text: string, limit?: number): Word[]
export function extractGrammar(text: string, limit?: number): Grammar[]
export function withLearning<T extends Pick<Article, 'content' | 'words' | 'grammar'>>(article: T): T
export function lookupWord(token: string): { base: string; meaning: string } | null
