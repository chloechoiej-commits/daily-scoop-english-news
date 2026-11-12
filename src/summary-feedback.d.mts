import type { Article } from './data'

export type SummaryFeedback = { vocabulary: string; grammar: string; keyPoints: string }
export function createSummaryFeedback(text: string, article: Article): SummaryFeedback | null
