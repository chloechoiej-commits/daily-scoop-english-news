import { supabase } from './supabase'

export type FeedbackExample = { original: string; suggestion: string; reason: string }
export type SummaryFeedback = {
  overall: string
  vocabulary: { comment: string; examples: FeedbackExample[] }
  grammar: { comment: string; examples: FeedbackExample[] }
  meaning: { comment: string; examples: FeedbackExample[] }
  revised_summary: string
}

export async function requestSummaryFeedback(articleId: string, summary: string): Promise<SummaryFeedback> {
  if (!supabase) throw new Error('AI 피드백을 사용하려면 관리자가 Supabase와 피드백 기능을 먼저 설정해야 해요.')
  const { data: current, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw new Error('로그인 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.')
  if (!current.session) {
    const { error } = await supabase.auth.signInAnonymously()
    if (error) throw new Error('학생 세션을 시작하지 못했어요. 관리자에게 익명 로그인 설정을 확인해 달라고 요청해 주세요.')
  }
  const { data, error } = await supabase.functions.invoke('summary-feedback', { body: { articleId, summary } })
  if (error) {
    if (error.context instanceof Response) {
      try {
        const body = await error.context.json()
        if (typeof body?.message === 'string') throw new Error(body.message)
      } catch (cause) {
        if (cause instanceof Error && !(cause instanceof SyntaxError)) throw cause
      }
    }
    throw new Error('피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
  if (!data?.feedback) throw new Error('피드백 응답이 올바르지 않아요. 다시 시도해 주세요.')
  return data.feedback as SummaryFeedback
}
