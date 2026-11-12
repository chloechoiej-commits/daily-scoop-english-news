import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildModelRequest, createHandler } from './handler.mjs'

const url = Deno.env.get('SUPABASE_URL') || ''
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const openaiKey = Deno.env.get('OPENAI_API_KEY') || ''
const model = Deno.env.get('SUMMARY_FEEDBACK_MODEL') || 'gpt-4o-mini'
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

const handler = createHandler({
  async getUser(token: string) {
    const auth = createClient(url, anonKey, { auth: { persistSession: false } })
    const { data, error } = await auth.auth.getUser(token)
    return error ? null : data.user
  },
  async getArticle(id: string, token: string) {
    const client = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } })
    const { data, error } = await client.from('articles').select('title,content,content_kind').eq('id', id).maybeSingle()
    if (error) throw error
    return data
  },
  async reserveQuota(userId: string) {
    const { data, error } = await admin.rpc('reserve_summary_feedback', { p_user_id: userId })
    if (error) throw error
    return data === true
  },
  async generate(article: { title: string; content: string; content_kind?: string }, summary: string) {
    if (!openaiKey) throw new Error('AI provider is not configured')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal: AbortSignal.timeout(45000),
      headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildModelRequest(article, summary, model)),
    })
    if (!response.ok) throw new Error('AI provider request failed')
    const data = await response.json()
    return JSON.parse(data.choices?.[0]?.message?.content || 'null')
  },
})

Deno.serve(handler)
