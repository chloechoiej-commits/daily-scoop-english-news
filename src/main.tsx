import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Highlighter, Send, MessageSquare, RefreshCw, Copy, ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Check, CheckCircle2, Clock3, FlaskConical, Globe, GraduationCap, Leaf, LogIn, LogOut, Palette, Plus, School, Search, Sparkles, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Article, demoArticles, type Term, type Word } from './data'
import { fetchAuthBox, readTeacherArticles, REPO, saveAuthBox, savePublicJson, verifyTeacher, writeTeacherArticles } from './github'
import { AUTH_FILE, MIN_PASSWORD, lockToken, unlockToken, type TokenBox } from './teacher-auth.mjs'
import { fetchAll, fetchFeedbackConfig, fetchMine, isWebAppUrl, loadStudent, newTeacherKey, pingTeacher, saveComment, saveStudent, submitSummary, CONFIG_FILE, SHEET_URL, type FeedbackConfig, type Student, type Submission } from './summaries'
import scriptSource from '../apps-script/Code.gs?raw'
import { translationParagraphs } from './translation.mjs'
import { extractGrammar, extractWords, lookupWord, withLearning, wordPattern } from './learning.mjs'
import { termPattern } from './glossary.mjs'
import { supabase } from './supabase'
import './style.css'

type Tab = 'article' | 'summary' | 'words' | 'grammar' | 'translation'
type View = 'home' | 'archive' | 'saved' | 'mine' | 'teacher'

// The five sections the collector fills every day, one story each.
const sections: { name: string; en: string; tone: string; icon: LucideIcon }[] = [
  { name: '환경', en: 'Planet', tone: 'green', icon: Leaf },
  { name: '과학', en: 'Science', tone: 'blue', icon: FlaskConical },
  { name: '생활', en: 'Life', tone: 'orange', icon: School },
  { name: '문화', en: 'Culture', tone: 'purple', icon: Palette },
  { name: '세상', en: 'World', tone: 'red', icon: Globe },
]
const sectionOf = (name: string) => sections.find(s => s.name === name) || sections[4]
const categories = ['전체', ...sections.map(s => s.name)]
const levels = [{ value: '전체', label: '전체 수준' }, { value: 'LEVEL 1', label: 'LEVEL 1 · 기초' }, { value: 'LEVEL 2', label: 'LEVEL 2 · 보통' }, { value: 'LEVEL 3', label: 'LEVEL 3 · 도전' }]
const levelLabel = (level: string) => levels.find(item => item.value === level)?.label || level
const levelShort = (level: string) => ({ 'LEVEL 1': '기초', 'LEVEL 2': '보통', 'LEVEL 3': '도전' } as Record<string, string>)[level] || level
const steps: [Tab, string, string][] = [['article', '읽기', 'Read'], ['summary', '요약', 'Summarize'], ['words', '단어', 'Words'], ['grammar', '문법', 'Grammar'], ['translation', '번역', 'Korean']]
// Short lines without an ending period are section subheadings inside an article.
const isSubhead = (line: string) => line.split(/\s+/).length <= 6 && !/[.!?"”’:)]$/.test(line) && !line.startsWith('•')
// Wraps the key words of an article (any inflection) so they can be highlighted and tapped.
function markWords(text: string, words: Word[], render: (match: string, word: Word, key: number) => React.ReactNode) {
  if (!words.length) return [text]
  const combined = new RegExp(`(${words.map(w => wordPattern(w.word).source).join('|')})`, 'gi')
  return text.split(combined).map((part, i) => {
    if (i % 2 === 0) return part
    const word = words.find(w => wordPattern(w.word).test(part))
    return word ? render(part, word, i) : part
  })
}
// Splits a paragraph into plain text, technical terms (first appearance only, numbered *n) and key words.
type Piece = string | { kind: 'term'; text: string; term: Term; no: number } | { kind: 'word'; text: string; word: Word }
function annotate(text: string, words: Word[], terms: Term[], seen: Set<string>): Piece[] {
  const termAlt = terms.map(t => termPattern(t.term).source).join('|')
  const wordAlt = words.map(w => wordPattern(w.word).source).join('|')
  if (!termAlt && !wordAlt) return [text]
  const re = new RegExp(`${termAlt ? `(${termAlt})` : '()'}|${wordAlt ? `(${wordAlt})` : '($^)'}`, 'gi')
  const out: Piece[] = []; let last = 0; let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (!m[0]) { re.lastIndex++; continue }
    if (m.index > last) out.push(text.slice(last, m.index))
    const term = m[1] ? terms.find(t => new RegExp(`^(?:${termPattern(t.term).source})$`, termPattern(t.term).flags).test(m![1])) : undefined
    if (term && !seen.has(term.term)) { seen.add(term.term); out.push({ kind: 'term', text: m[0], term, no: terms.indexOf(term) + 1 }) }
    else if (m[2]) { const word = words.find(w => wordPattern(w.word).test(m![2])); out.push(word ? { kind: 'word', text: m[0], word } : m[0]) }
    else out.push(m[0])
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
// Highlights one phrase inside an example sentence.
function highlight(sentence: string, phrase?: string) {
  const at = phrase ? sentence.toLowerCase().indexOf(phrase.toLowerCase()) : -1
  return at < 0 ? sentence : <>{sentence.slice(0, at)}<mark>{sentence.slice(at, at + phrase!.length)}</mark>{sentence.slice(at + phrase!.length)}</>
}
const formatTime = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d) }
type Highlight = { word: string; memo: string; at: string }
const WORD_SPLIT = /([A-Za-z](?:[A-Za-z’'-]*[A-Za-z])?)/
const normWord = (token: string) => token.toLowerCase().replace(/[’']s$/, '')
const editionDay = (a: Article) => a.collection_day || a.published_at
const isTeacherPick = (a: Article) => a.id.startsWith('teacher-') ? 1 : 0
// Newest paper day first; on the same day a teacher's pick leads its section.
const byNewest = (a: Article, b: Article) => editionDay(b).localeCompare(editionDay(a)) || isTeacherPick(b) - isTeacherPick(a) || (b.created_at || '').localeCompare(a.created_at || '')
const formatDay = (day: string, withWeekday = false) => { const d = new Date(`${day}T00:00:00`); return Number.isNaN(d.getTime()) ? day : new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', ...(withWeekday ? { weekday: 'long' } : {}) }).format(d) }
const readStorage = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback } }
const writeStorage = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ } }

function Cover({ category, big = false }: { category: string; big?: boolean }) {
  const section = sectionOf(category); const Icon = section.icon
  return <div className={`cover tone-${section.tone} ${big ? 'cover-big' : ''}`} aria-hidden="true"><Icon className="cover-icon" size={big ? 120 : 72} strokeWidth={1.25}/><span className="cover-en">{section.en}</span></div>
}

function App() {
  const [articles, setArticles] = useState<Article[]>([])
  const [demo, setDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Article | null>(null)
  const [tab, setTab] = useState<Tab>('article')
  const [category, setCategory] = useState('전체')
  const [level, setLevel] = useState('전체')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>(() => location.hash === '#teacher' ? 'teacher' : 'home')
  const [saved, setSaved] = useState<string[]>(() => readStorage('scoop-saved', []))
  const [completed, setCompleted] = useState<string[]>(() => readStorage('scoop-completed', []))
  const [notes, setNotes] = useState<Record<string, string>>(() => readStorage('scoop-notes', {}))
  // Words a student highlighted while reading, with an optional memo: { articleId: { word: Highlight } }.
  const [highlights, setHighlights] = useState<Record<string, Record<string, Highlight>>>(() => readStorage('scoop-highlights', {}))
  // Summaries go to the teacher's Google Sheet (see src/summaries.ts); undefined = still checking.
  const [feedbackConfig, setFeedbackConfig] = useState<FeedbackConfig | null | undefined>(undefined)
  const [student, setStudent] = useState<Student>(loadStudent)
  const [mine, setMine] = useState<Submission[]>([])
  const [submitBusy, setSubmitBusy] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [revealed, setRevealed] = useState<number[]>([])
  const [openWord, setOpenWord] = useState('')

  useEffect(() => { writeStorage('scoop-saved', saved) }, [saved])
  useEffect(() => { writeStorage('scoop-completed', completed) }, [completed])
  useEffect(() => { writeStorage('scoop-notes', notes) }, [notes])
  useEffect(() => { writeStorage('scoop-highlights', highlights) }, [highlights])
  useEffect(() => {
    fetchFeedbackConfig(import.meta.env.BASE_URL).then(config => { setFeedbackConfig(config); if (config) refreshMine(config) })
  }, [])
  async function refreshMine(config = feedbackConfig) {
    if (!config) return
    try { setMine(await fetchMine(config.url, student.id)) } catch { /* offline: keep what we have */ }
  }

  useEffect(() => {
    loadArticles()
    const onHash = () => { if (location.hash === '#teacher') { setSelected(null); setView('teacher') } else setView(v => v === 'teacher' ? 'home' : v) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Daily RSS picks and teacher uploads are static JSON in the site; Supabase articles are added when configured.
  async function loadArticles() {
    setLoading(true); setError('')
    const fetchJson = async (path: string): Promise<Article[]> => { try { const r = await fetch(`${import.meta.env.BASE_URL}${path}?v=${Date.now()}`, { cache: 'no-store' }); const data = r.ok ? await r.json() : []; return Array.isArray(data) ? data : [] } catch { return [] } }
    const [daily, teacher] = await Promise.all([fetchJson('data/articles.json'), fetchJson('data/teacher-articles.json')])
    let remote: Article[] = []
    if (supabase) {
      const { data, error: fetchError } = await supabase.from('articles').select('*').order('published_at', { ascending: false })
      if (fetchError) setError('일부 기사를 불러오지 못했어요.')
      else remote = (data || []) as Article[]
    }
    const all = [...teacher, ...daily, ...remote].map(withLearning)
    setDemo(all.length === 0)
    setArticles(all.length ? all : demoArticles.map(withLearning))
    setLoading(false)
  }

  const sorted = useMemo(() => [...articles].sort(byNewest), [articles])
  // Today's paper: the newest story in each section.
  const todays = useMemo(() => sections.map(s => ({ section: s, article: sorted.find(a => a.category === s.name) })), [sorted])
  const lead = useMemo(() => todays.map(t => t.article).filter(Boolean).sort((a, b) => byNewest(a!, b!))[0], [todays])
  const editionDate = lead ? editionDay(lead) : ''
  const todaysDone = todays.filter(t => t.article && completed.includes(t.article.id)).length
  const todaysCount = todays.filter(t => t.article).length

  const filtered = useMemo(() => sorted.filter(a => (category === '전체' || a.category === category) && (level === '전체' || a.level === level) && (view !== 'saved' || saved.includes(a.id)) && `${a.title} ${a.title_ko} ${a.category} ${a.source}`.toLowerCase().includes(search.toLowerCase())), [sorted, category, level, search, view, saved])
  const grouped = useMemo(() => { const map = new Map<string, Article[]>(); for (const a of filtered) map.set(editionDay(a), [...(map.get(editionDay(a)) || []), a]); return [...map.entries()] }, [filtered])

  const resetFeedback = () => setSubmitMsg(null)
  const openArticle = (article: Article, nextTab: Tab = 'article') => { resetFeedback(); setSelected(article); setTab(nextTab); setRevealed([]); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const navigate = (next: View, nextCategory = '전체') => { resetFeedback(); if (next !== 'teacher' && location.hash) history.replaceState(null, '', location.pathname + location.search); if (next === 'teacher') location.hash = 'teacher'; setView(next); setSelected(null); setCategory(nextCategory); setLevel('전체'); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function submitToTeacher(article: Article) {
    const text = (notes[article.id] || '').trim()
    if (!feedbackConfig || text.length < 5 || !student.name.trim() || submitBusy) return
    setSubmitBusy(true); setSubmitMsg(null)
    try {
      await submitSummary(feedbackConfig.url, { ...student, name: student.name.trim() }, { id: article.id, title: article.title, day: editionDay(article) }, text)
      setSubmitMsg({ kind: 'ok', text: '선생님께 제출했어요! 피드백이 오면 여기와 "내 요약"에서 볼 수 있어요.' })
      refreshMine()
    } catch (error) {
      setSubmitMsg({ kind: 'error', text: error instanceof Error ? error.message : '제출하지 못했어요.' })
    } finally { setSubmitBusy(false) }
  }
  const updateStudent = (patch: Partial<Student>) => { const next = { ...student, ...patch }; setStudent(next); saveStudent(next) }
  const myFeedbackCount = mine.filter(m => m.feedback).length

  const myMarks = (articleId: string) => highlights[articleId] || {}
  const toggleHighlight = (articleId: string, token: string) => setHighlights(prev => {
    const marks = { ...(prev[articleId] || {}) }; const key = normWord(token)
    if (marks[key]) delete marks[key]; else marks[key] = { word: key, memo: '', at: new Date().toISOString() }
    return { ...prev, [articleId]: marks }
  })
  const setMemo = (articleId: string, key: string, memo: string) => setHighlights(prev => {
    const marks = prev[articleId] || {}
    const current = marks[key] || { word: key, memo: '', at: new Date().toISOString() }
    return { ...prev, [articleId]: { ...marks, [key]: { ...current, memo } } }
  })
  // One clickable word: tap to open a small card with highlight + memo (and the dictionary meaning if known).
  const wordToken = (a: Article, token: string, id: string, meaning?: string, extraClass = '') => {
    const key = normWord(token); const mark = myMarks(a.id)[key]; const open = openWord === id
    const hint = meaning || lookupWord(token)?.meaning
    return <span key={id} role="button" tabIndex={0} className={`w ${extraClass} ${mark ? 'hl' : ''} ${open ? 'open' : ''}`} aria-expanded={open} onClick={() => setOpenWord(open ? '' : id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenWord(open ? '' : id) } }}>{token}{mark?.memo && <span className="memo-dot" aria-label="메모 있음">✎</span>}
      {open && <span className="vocab-pop word-pop" role="dialog" aria-label={`${key} 형광펜과 메모`} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
        <span className="word-pop-head"><b>{key}</b>{hint && <span>{hint}</span>}<button type="button" className="word-pop-close" aria-label="닫기" onClick={() => setOpenWord('')}><X size={15}/></button></span>
        <button type="button" className={`hl-button ${mark ? 'on' : ''}`} onClick={() => toggleHighlight(a.id, token)}><Highlighter size={15}/> {mark ? '형광펜 지우기' : '형광펜 칠하기'}</button>
        {mark && <textarea className="memo-input" rows={2} maxLength={300} placeholder="메모: 뜻, 예문, 궁금한 점…" value={mark.memo} autoFocus onChange={e => setMemo(a.id, key, e.target.value)}/>}
      </span>}
    </span>
  }
  const plainWords = (a: Article, text: string, prefix: string) => text.split(WORD_SPLIT).map((part, t) => t % 2 === 1 ? wordToken(a, part, `${prefix}-${t}`) : part)

  const toggleSaved = (id: string) => setSaved(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  const markDone = (id: string) => setCompleted(prev => prev.includes(id) ? prev : [...prev, id])
  const today = formatDay(new Date().toLocaleDateString('en-CA'), true)
  const goTab = (next: Tab) => { setTab(next); setRevealed([]); document.querySelector('.reader-steps')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }

  const saveButton = (article: Article) => <button className={`save-button ${saved.includes(article.id) ? 'is-saved' : ''}`} onClick={() => toggleSaved(article.id)} aria-label={saved.includes(article.id) ? '저장 취소' : '기사 저장'} aria-pressed={saved.includes(article.id)}><Bookmark size={17} fill={saved.includes(article.id) ? 'currentColor' : 'none'}/></button>

  return <div className="app">
    <header className="masthead">
      <div className="mast-bar">
        <span className="mast-date">{today}</span>
        <span className="mast-note"><Clock3 size={13}/> 매일 아침 7시 · 5개 분야 5편</span>
        <button className={`teacher-button ${view === 'teacher' ? 'active' : ''}`} onClick={() => navigate('teacher')}><GraduationCap size={15}/>선생님 전용</button>
      </div>
      <button className="wordmark" onClick={() => navigate('home')} aria-label="Daily Scoop 홈"><span className="wordmark-the">The</span> Daily Scoop</button>
      <p className="tagline">세상을 읽는 하루 다섯 편의 영어 뉴스</p>
      <nav className="mast-nav" aria-label="주 메뉴">
        <button className={view === 'home' && !selected ? 'active' : ''} onClick={() => navigate('home')}>오늘의 신문</button>
        {sections.map(s => <button key={s.name} className={`nav-section tone-${s.tone} ${view === 'archive' && !selected && category === s.name ? 'active' : ''}`} onClick={() => navigate('archive', s.name)}>{s.name}</button>)}
        <button className={view === 'archive' && !selected && category === '전체' ? 'active' : ''} onClick={() => navigate('archive')}>지난 기사</button>
        <button className={view === 'mine' && !selected ? 'active' : ''} onClick={() => { navigate('mine'); refreshMine() }}>내 요약{myFeedbackCount > 0 && <span className="nav-count">{myFeedbackCount}</span>}</button>
        <button className={view === 'saved' && !selected ? 'active' : ''} onClick={() => navigate('saved')}>저장함{saved.length > 0 && <span className="nav-count">{saved.length}</span>}</button>
      </nav>
    </header>

    <main className="main">
      {view === 'teacher' ? <TeacherPage published={articles.filter(a => a.id.startsWith('teacher-'))} onSaved={next => setArticles(prev => [...next.map(withLearning), ...prev.filter(a => !a.id.startsWith('teacher-'))])}/> : selected ? Reader() : view === 'home' ? Home() : view === 'mine' ? MySummaries() : Archive()}
    </main>

    <footer className="footer"><span className="footer-mark">The Daily Scoop</span><p>기사는 공개 RSS에서 매일 수집되며 원문 저작권은 각 출처에 있어요. 학습 완료 표시와 작성 중인 요약은 이 브라우저에, 제출한 요약은 선생님의 구글 스프레드시트에 저장돼요.</p></footer>
  </div>

  function Home() {
    if (loading) return <div className="empty-state">오늘의 신문을 펼치는 중이에요...</div>
    if (error) return <div className="empty-state">{error}</div>
    const rest = todays.filter(t => t.article !== lead)
    return <>
      <section className="edition-bar">
        <div><span className="kicker">TODAY'S EDITION</span><h1>{editionDate ? `${formatDay(editionDate)} 자` : '오늘의'} {todaysCount}편</h1><p>환경·과학·생활·문화·세상, 분야마다 한 편씩 골라 담았어요.</p></div>
        <div className="progress" aria-label={`오늘의 기사 ${todaysCount}편 중 ${todaysDone}편 학습 완료`}>
          <div className="progress-dots">{todays.map(({ section, article }) => <span key={section.name} className={`dot tone-${section.tone} ${article && completed.includes(article.id) ? 'done' : ''}`} title={section.name}>{article && completed.includes(article.id) ? <Check size={13}/> : section.name.slice(0, 1)}</span>)}</div>
          <span><b>{todaysDone}</b> / {todaysCount}편 완료</span>
        </div>
      </section>
      {demo && <p className="notice"><Sparkles size={15}/> <span><b>예시 지문</b> · 첫 자동 수집 전이라 연습용 지문을 보여 줘요. 매일 아침 7시쯤 5개 분야 기사가 자동으로 채워져요.</span></p>}

      {lead && <article className={`lead tone-${sectionOf(lead.category).tone}`}>
        <button className="lead-cover" onClick={() => openArticle(lead)} aria-label={`${lead.title} 읽기`}><Cover category={lead.category} big/></button>
        <div className="lead-copy">
          <div className="card-kicker"><span className="section-tag">{lead.category}</span><span className="level-tag">{levelLabel(lead.level)}</span>{lead.id.startsWith('teacher-') && <span className="teacher-tag">선생님 추천</span>}{completed.includes(lead.id) && <span className="done-tag"><CheckCircle2 size={13}/> 완료</span>}</div>
          <button className="lead-title" onClick={() => openArticle(lead)}>{lead.title}</button>
          {lead.title_ko && <p className="title-ko">{lead.title_ko}</p>}
          <p className="lead-excerpt">{lead.excerpt}</p>
          <div className="card-meta"><span>{lead.source}</span><span>{lead.reading_minutes}분 읽기</span></div>
          <div className="lead-actions"><button className="primary-button" onClick={() => openArticle(lead)}>읽기 시작 <ArrowRight size={17}/></button>{saveButton(lead)}</div>
        </div>
      </article>}

      <section className="front-grid">
        {rest.map(({ section, article }) => article ? <article key={section.name} className={`story tone-${section.tone}`}>
          <button className="story-cover" onClick={() => openArticle(article)} aria-label={`${article.title} 읽기`}><Cover category={article.category}/></button>
          <div className="card-kicker"><span className="section-tag">{article.category}</span><span className="level-tag">{levelShort(article.level)}</span>{article.id.startsWith('teacher-') && <span className="teacher-tag">선생님 추천</span>}{completed.includes(article.id) && <span className="done-tag"><CheckCircle2 size={13}/></span>}</div>
          <button className="story-title" onClick={() => openArticle(article)}>{article.title}</button>
          <p className="story-excerpt">{article.excerpt}</p>
          <div className="story-foot"><span className="card-meta"><span>{article.source}</span><span>{article.reading_minutes}분</span></span>{saveButton(article)}</div>
        </article> : <article key={section.name} className={`story story-empty tone-${section.tone}`}><Cover category={section.name}/><div className="card-kicker"><span className="section-tag">{section.name}</span></div><p className="story-title">새 {section.name} 기사를 기다리고 있어요</p><p className="story-excerpt">다음 수집 때 이 분야의 기사가 채워져요.</p></article>)}
      </section>

      <section className="routine">
        <div className="routine-head"><span className="kicker">HOW TO READ</span><h2>한 편을 다섯 단계로</h2></div>
        <ol>{steps.map(([id, ko, en], i) => <li key={id}><button onClick={() => lead && openArticle(lead, id)} disabled={!lead}><span className="step-no">{i + 1}</span><b>{ko}</b><small>{en}</small></button></li>)}</ol>
      </section>

      <section className="stats">
        <div><strong>{completed.length}</strong><span>지금까지 완료한 기사</span></div>
        <div><strong>{saved.length}</strong><span>저장한 기사</span></div>
        <div><strong>{articles.length}</strong><span>읽을 수 있는 기사</span></div>
        <button className="text-link" onClick={() => navigate('archive')}>지난 기사 모두 보기 <ArrowRight size={16}/></button>
      </section>
    </>
  }

  function MySummaries() {
    const byArticle = (id: string) => articles.find(x => x.id === id)
    return <section className="archive">
      <div className="page-head"><span className="kicker">MY SUMMARIES</span><h1>내 요약</h1><p>선생님께 제출한 요약과 받은 피드백을 모아 봐요.</p></div>
      {feedbackConfig === null ? <div className="empty-state">선생님이 아직 요약 제출 기능을 연결하지 않았어요.</div> : mine.length === 0 ? <div className="empty-state">아직 제출한 요약이 없어요. 기사를 읽고 2단계 "요약"에서 제출해 보세요.</div> :
        <ul className="row-list">{[...mine].sort((x, y) => y.submittedAt.localeCompare(x.submittedAt)).map(m => { const art = byArticle(m.articleId); return <li key={m.id} className={`my-submission row-sub ${m.feedback ? 'has-feedback' : ''}`}>
          <div className="sub-head"><button className="row-title" disabled={!art} onClick={() => art && openArticle(art, 'summary')}>{m.articleTitle}</button><span>{formatTime(m.submittedAt)} 제출</span></div>
          <p className="sub-text">{m.summary}</p>
          {m.feedback ? <div className="teacher-comment"><div className="sub-head"><b><GraduationCap size={16}/> 선생님 피드백</b><span>{formatTime(m.feedbackAt)}</span></div><p>{m.feedback}</p></div> : <p className="hint waiting">선생님 피드백을 기다리고 있어요.</p>}
        </li> })}</ul>}
      <p className="hint">제출 기록은 이 기기·브라우저와 연결되어 있어요. 다른 기기에서는 보이지 않아요.</p>
    </section>
  }

  function Archive() {
    const isSaved = view === 'saved'
    return <section className="archive">
      <div className="page-head"><span className="kicker">{isSaved ? 'MY CLIPPINGS' : 'ARCHIVE'}</span><h1>{isSaved ? '저장한 기사' : category === '전체' ? '지난 기사' : `${category} 기사`}</h1><p>{isSaved ? '다시 읽고 싶은 이야기를 모아 두었어요.' : '날짜별로 지난 신문을 넘겨 보세요.'}</p></div>
      <div className="filters">
        <div className="chip-row" role="group" aria-label="분야">{categories.map(c => <button key={c} className={`chip ${c !== '전체' ? `tone-${sectionOf(c).tone}` : ''} ${category === c ? 'active' : ''}`} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <div className="filter-tools">
          <select aria-label="난이도" value={level} onChange={e => setLevel(e.target.value)}>{levels.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <label className="search-box"><Search size={16}/><input aria-label="기사 검색" placeholder="제목, 출처 검색" value={search} onChange={e => setSearch(e.target.value)}/></label>
        </div>
      </div>
      {loading ? <div className="empty-state">기사를 불러오는 중이에요...</div> : error ? <div className="empty-state">{error}</div> : grouped.length === 0 ? <div className="empty-state">{isSaved && saved.length === 0 ? '아직 저장한 기사가 없어요. 기사 옆 책갈피를 눌러 보세요.' : '조건에 맞는 기사가 없어요.'}</div> : grouped.map(([day, list]) => <div className="day-group" key={day}>
        <h2 className="day-heading">{formatDay(day, true)}<span>{list.length}편</span></h2>
        <ul className="row-list">{list.map(article => <li key={article.id} className={`row tone-${sectionOf(article.category).tone}`}>
          <span className="row-icon">{React.createElement(sectionOf(article.category).icon, { size: 20, strokeWidth: 1.75 })}</span>
          <button className="row-main" onClick={() => openArticle(article)}><span className="card-kicker"><span className="section-tag">{article.category}</span><span className="level-tag">{levelShort(article.level)}</span>{article.id.startsWith('teacher-') && <span className="teacher-tag">선생님 추천</span>}{completed.includes(article.id) && <span className="done-tag"><CheckCircle2 size={13}/> 완료</span>}</span><span className="row-title">{article.title}</span><span className="row-excerpt">{article.excerpt}</span><span className="card-meta"><span>{article.source}</span><span>{article.reading_minutes}분 읽기</span></span></button>
          {saveButton(article)}
        </li>)}</ul>
      </div>)}
    </section>
  }

  function Reader() {
    const a = selected!
    const section = sectionOf(a.category)
    const stepIndex = steps.findIndex(([id]) => id === tab)
    return <article className={`reader tone-${section.tone}`}>
      <div className="reader-top"><button className="back-button" onClick={() => { resetFeedback(); setSelected(null) }}><ArrowLeft size={17}/> 목록으로</button>{saveButton(a)}</div>
      <header className="reader-head">
        <div className="card-kicker"><span className="section-tag">{a.category} · {section.en}</span><span className="level-tag">{levelLabel(a.level)}</span></div>
        <h1>{a.title}</h1>
        <div className="reader-meta"><span>출처 {a.source_url ? <a href={a.source_url} target="_blank" rel="noopener noreferrer">{a.source} <ArrowUpRight size={12}/></a> : a.source}</span><span>{formatDay(a.published_at)}</span><span><Clock3 size={13}/> {a.reading_minutes}분 읽기</span></div>
        {a.id.startsWith('example-') && <p className="disclaimer">예시 학습 지문 · 위 원문을 참고해 수준에 맞게 새로 작성했어요. 원문 기사는 출처 링크에서 확인하세요.</p>}
        {a.content_kind === 'rss_excerpt' && <p className="disclaimer">이 출처는 요약 기사만 제공해요. 아래는 요약 전문이고, 자세한 내용은 출처 링크에서 읽을 수 있어요. 난이도는 자동 추정치예요.</p>}
        {a.content_kind === 'rss_full' && <p className="disclaimer">출처가 공개 피드로 제공한 기사 전문이에요. 저작권은 원 출처에 있어요. 난이도와 읽기 시간은 자동 추정치예요.</p>}
        {a.content_kind === 'ai_generated' && <p className="disclaimer">공개 피드를 바탕으로 AI가 작성한 학습 지문이에요. 오류가 있을 수 있으니 원문과 대조해 주세요.</p>}
      </header>
      <nav className="reader-steps" aria-label="학습 단계">{steps.map(([id, ko], i) => <button key={id} className={`${tab === id ? 'active' : ''} ${i < stepIndex ? 'past' : ''}`} aria-current={tab === id ? 'step' : undefined} onClick={() => goTab(id)}><span>{i + 1}</span>{ko}</button>)}</nav>
      <div className="reader-body">
        {tab === 'article' && <><StepHead no={1} title="차근차근 읽어 볼까요?" help="모르는 단어가 나와도 괜찮아요. 전체 흐름을 먼저 잡아 보세요."/><p className="vocab-hint"><span className="vocab-mark-sample">밑줄 친 단어</span>를 누르면 뜻을, <span className="term-star sample">*</span> 표시를 누르면 전문 용어 풀이를 볼 수 있어요. 모르는 단어는 눌러서 <span className="hl-sample">형광펜</span>을 칠하고 메모해 보세요.</p>{(() => { const seen = new Set<string>(); const terms = a.terms || []; return <div className="article-copy" onClick={e => { if (!(e.target as HTMLElement).closest('.w, .term')) setOpenWord('') }}>{a.content.split(/\n+/).filter(Boolean).map((paragraph, i) => isSubhead(paragraph) ? <h3 key={i} className="article-subhead">{paragraph}</h3> : <p key={i}>{annotate(paragraph, a.words || [], terms, seen).map((piece, k) => {
            const id = `${i}-${k}`
            if (typeof piece === 'string') return <React.Fragment key={k}>{plainWords(a, piece, id)}</React.Fragment>
            if (piece.kind === 'term') return <span key={k} className={`term ${openWord === id ? 'open' : ''}`}>{piece.text.replace(/\S+$/, '')}<span className="term-tail">{piece.text.match(/\S+$/)?.[0]}<button type="button" className="term-star" aria-label={`${piece.term.term} 용어 풀이 ${piece.no}`} aria-expanded={openWord === id} onClick={() => setOpenWord(openWord === id ? '' : id)}>*{piece.no}</button></span>{openWord === id && <span className="vocab-pop term-pop" role="tooltip"><b>{piece.term.ko}</b>{piece.term.note}</span>}</span>
            return wordToken(a, piece.text, id, piece.word.meaning, 'vocab-mark')
          })}</p>)}</div> })()}{a.terms?.length ? <section className="term-notes" aria-label="용어 풀이"><h3>용어 풀이</h3><ol>{a.terms.map((t, i) => <li key={t.term}><span className="term-no">*{i + 1}</span><div><b>{t.term}</b> <span className="term-ko">{t.ko}</span><p>{t.note}</p></div></li>)}</ol></section> : null}{Object.keys(myMarks(a.id)).length > 0 && <section className="my-marks" aria-label="내 형광펜과 메모"><h3><Highlighter size={17}/> 내 형광펜·메모 <span className="nav-count">{Object.keys(myMarks(a.id)).length}</span></h3><ul>{Object.values(myMarks(a.id)).sort((x, y) => x.at.localeCompare(y.at)).map(m => <li key={m.word}><div className="mark-word"><b>{m.word}</b>{lookupWord(m.word) && <span>{lookupWord(m.word)!.meaning}</span>}</div><textarea className="memo-input" rows={1} maxLength={300} placeholder="메모를 적어 보세요" value={m.memo} onChange={e => setMemo(a.id, m.word, e.target.value)}/><button className="icon-button" aria-label={`${m.word} 형광펜 지우기`} onClick={() => toggleHighlight(a.id, m.word)}><X size={15}/></button></li>)}</ul><p className="hint">형광펜과 메모는 이 브라우저에 저장돼요.</p></section>}{(a.words?.length || a.grammar?.length) ? <aside className="study-box"><div><h3>이 기사의 주요 단어</h3><ul className="study-words">{a.words.map(w => <li key={w.word}><b>{w.word}</b><span>{w.meaning}</span></li>)}</ul><button className="text-link" onClick={() => goTab('words')}>단어 카드로 익히기 <ArrowRight size={15}/></button></div><div><h3>문법 포인트</h3><ul className="study-grammar">{a.grammar.map(g => <li key={g.title}><b>{g.title}</b>{g.focus && <span>“{g.focus}”</span>}</li>)}</ul><button className="text-link" onClick={() => goTab('grammar')}>문법 설명 보기 <ArrowRight size={15}/></button></div></aside> : null}{a.content_kind === 'rss_excerpt' && a.source_url && <a className="source-cta" href={a.source_url} target="_blank" rel="noopener noreferrer">{a.source}에서 전체 기사 읽기 <ArrowUpRight size={16}/></a>}<NextBar text="다 읽었다면 내 말로 정리해 봐요." label="요약하기" onClick={() => goTab('summary')}/></>}
        {tab === 'summary' && (() => { const sub = mine.find(m => m.articleId === a.id); const text = notes[a.id] || ''; return <><StepHead no={2} title="나만의 문장으로 요약해요" help="가장 중요한 내용을 영어 또는 한국어로 자유롭게 적고, 선생님께 제출해 피드백을 받아 보세요."/>
          <div className="form-row student-row"><label className="field-label">이름<input className="text-input" value={student.name} maxLength={40} placeholder="예: 김민지" onChange={e => updateStudent({ name: e.target.value })}/></label><label className="field-label">반·번호 <small>선택</small><input className="text-input" value={student.className} maxLength={20} placeholder="예: 2-3 15번" onChange={e => updateStudent({ className: e.target.value })}/></label></div>
          <label className="field-label" htmlFor="summary-note">내가 정리한 내용</label><textarea id="summary-note" className="note-area" maxLength={3000} placeholder="이 기사는 어떤 이야기인가요?" value={text} onChange={e => { setNotes({ ...notes, [a.id]: e.target.value }); setSubmitMsg(null) }}/>
          <p className="hint">작성 중인 요약은 이 브라우저에 자동 저장돼요. 5자 이상 쓰고 제출하면 선생님이 읽고 댓글로 피드백을 남겨 주세요.</p>
          {feedbackConfig === null ? <p className="notice">선생님이 아직 요약 제출 기능을 연결하지 않았어요. 요약은 이 브라우저에 저장되어 있어요.</p> : <button className="primary-button" disabled={!feedbackConfig || submitBusy || text.trim().length < 5 || !student.name.trim()} onClick={() => submitToTeacher(a)}><Send size={17}/> {submitBusy ? '제출하는 중...' : sub ? '고친 요약 다시 제출하기' : '선생님께 제출하기'}</button>}
          {!student.name.trim() && feedbackConfig && <p className="hint">제출하려면 이름을 적어 주세요.</p>}
          {submitMsg && <p className={`teacher-message ${submitMsg.kind}`} role={submitMsg.kind === 'error' ? 'alert' : 'status'}>{submitMsg.kind === 'ok' ? <CheckCircle2 size={17}/> : <X size={17}/>} {submitMsg.text}</p>}
          {sub && <section className="my-submission" aria-label="제출한 요약과 선생님 피드백"><div className="sub-head"><b>제출한 요약</b><span>{formatTime(sub.submittedAt)}</span></div><p className="sub-text">{sub.summary}</p>{sub.feedback ? <div className="teacher-comment"><div className="sub-head"><b><GraduationCap size={16}/> 선생님 피드백</b><span>{formatTime(sub.feedbackAt)}</span></div><p>{sub.feedback}</p></div> : <p className="hint waiting">선생님 피드백을 기다리고 있어요.</p>}</section>}
          <NextBar text="핵심 단어를 익혀 볼까요?" label="단어 학습" onClick={() => goTab('words')}/></> })()}
        {tab === 'words' && <><StepHead no={3} title="오늘의 단어" help="카드를 눌러 뜻과 예문을 확인해 보세요."/><div className="word-grid">{a.words?.length ? a.words.map((word, i) => <button className={`word-card ${revealed.includes(i) ? 'revealed' : ''}`} key={i} aria-expanded={revealed.includes(i)} onClick={() => setRevealed(revealed.includes(i) ? revealed.filter(n => n !== i) : [...revealed, i])}><span className="word-no">{String(i + 1).padStart(2, '0')}</span><strong>{word.word}</strong>{revealed.includes(i) ? <><b>{word.meaning}</b><em>{markWords(word.example, [word], (m, _w, k) => <mark key={k}>{m}</mark>)}</em></> : <small>눌러서 뜻 보기</small>}</button>) : <p className="empty-state">아직 등록된 단어가 없어요.</p>}</div><NextBar text="문장 속 문법도 살펴봐요." label="문법 보기" onClick={() => goTab('grammar')}/></>}
        {tab === 'grammar' && <><StepHead no={4} title="문장 속 문법" help="기사에서 만난 표현을 하나씩 알아볼까요?"/><div className="grammar-list">{a.grammar?.length ? a.grammar.map((item, i) => <div className="grammar-card" key={i}><span className="grammar-number">{String(i + 1).padStart(2, '0')}</span><div><h3>{item.title}</h3><p>{item.explanation}</p><blockquote>{highlight(item.example, item.focus)}</blockquote></div></div>) : <p className="empty-state">아직 등록된 문법 설명이 없어요.</p>}</div><div className="complete-box"><div><b>{completed.includes(a.id) ? '학습을 완료했어요!' : '여기까지 왔다면 거의 끝!'}</b><span>완료 표시하면 오늘의 진행률에 반영돼요.</span></div><button className={`primary-button ${completed.includes(a.id) ? 'is-done' : ''}`} onClick={() => markDone(a.id)}><Check size={17}/> {completed.includes(a.id) ? '완료됨' : '학습 완료'}</button></div><NextBar text="마지막으로 한국어로 확인해요." label="번역 보기" onClick={() => goTab('translation')}/></>}
        {tab === 'translation' && <><StepHead no={5} title="한국어로 확인해요" help={`읽기와 학습을 마친 뒤 내용을 확인해 보세요.${a.content_kind === 'ai_generated' ? ' AI 번역은 틀릴 수 있으니 원문과 비교해 주세요.' : ''}`}/>{translationParagraphs(a.translation_ko).length ? <div className="translation-copy">{translationParagraphs(a.translation_ko).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div> : <div className="empty-state">아직 이 지문의 한국어 번역이 등록되지 않았어요.</div>}<div className="next-bar"><button className="text-link" onClick={() => goTab('article')}><ArrowLeft size={16}/> 영어 지문 다시 읽기</button><button className="primary-button" onClick={() => navigate('home')}>오늘의 신문으로 <ArrowRight size={17}/></button></div></>}
      </div>
    </article>
  }
}

function StepHead({ no, title, help }: { no: number; title: string; help: string }) {
  return <div className="step-head"><span className="kicker">STEP {no} / 5</span><h2>{title}</h2><p>{help}</p></div>
}

function NextBar({ text, label, onClick }: { text: string; label: string; onClick: () => void }) {
  return <div className="next-bar"><span>{text}</span><button className="primary-button" onClick={onClick}>{label} <ArrowRight size={17}/></button></div>
}


const TOKEN_KEY = 'scoop-teacher-token'
const coverFor: Record<string, string> = { 환경: 'sage', 과학: 'blue', 생활: 'peach', 문화: 'lilac', 세상: 'coral' }
const loadToken = () => { try { localStorage.removeItem(TOKEN_KEY); return sessionStorage.getItem(TOKEN_KEY) || '' } catch { return '' } }
const seoulToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())

function TeacherPage({ published, onSaved }: { published: Article[]; onSaved: (articles: Article[]) => void }) {
  const [token, setToken] = useState(loadToken)
  const [login, setLogin] = useState('')
  const [checking, setChecking] = useState(!!token)
  const [box, setBox] = useState<TokenBox | null | undefined>(undefined)
  const [setup, setSetup] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [mine, setMine] = useState<Article[]>(published)
  const [section, setSection] = useState<'summaries' | 'articles'>('summaries')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => { fetchAuthBox(import.meta.env.BASE_URL, AUTH_FILE).then(setBox) }, [])
  useEffect(() => {
    if (!token) return
    let live = true
    setChecking(true)
    verifyTeacher(token).then(async name => { if (!live) return; setLogin(name || '선생님'); const { articles } = await readTeacherArticles(token); if (live) setMine(articles) })
      .catch(error => { if (live) { logout(); setMessage({ kind: 'error', text: error instanceof Error && /토큰|권한/.test(error.message) ? '저장된 GitHub 토큰이 만료되었거나 권한이 없어요. 관리자가 "로그인 다시 설정하기"로 새 토큰을 등록해 주세요.' : '로그인하지 못했어요.' }) } })
      .finally(() => live && setChecking(false))
    return () => { live = false }
  }, [token])

  function startSession(value: string) { try { sessionStorage.setItem(TOKEN_KEY, value) } catch { /* memory only */ } setMessage(null); setToken(value) }
  function logout() { try { sessionStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } setToken(''); setLogin(''); setMessage(null) }

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget
    const password = String(new FormData(form).get('password') || '')
    setBusy(true); setMessage(null)
    try { startSession(await unlockToken(box, password)); form.reset() }
    catch (error) { setMessage({ kind: 'error', text: error instanceof Error ? error.message : '로그인하지 못했어요.' }) }
    finally { setBusy(false) }
  }

  // First-time setup (or token renewal): checks the token, then stores it encrypted with the new password.
  async function configure(e: React.FormEvent<HTMLFormElement>, existingToken?: string) {
    e.preventDefault(); const form = e.currentTarget; const f = new FormData(form)
    const newToken = existingToken || String(f.get('token') || '').trim()
    const password = String(f.get('password') || ''); const confirmPassword = String(f.get('confirm') || '')
    if (password !== confirmPassword) { setMessage({ kind: 'error', text: '비밀번호 확인이 일치하지 않아요.' }); return }
    setBusy(true); setMessage(null)
    try {
      if (!existingToken) await verifyTeacher(newToken)
      const locked = await lockToken(newToken, password)
      await saveAuthBox(newToken, AUTH_FILE, locked)
      setBox(locked); setSetup(false); form.reset()
      if (!existingToken) startSession(newToken)
      setMessage({ kind: 'ok', text: existingToken ? '비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 쓰세요.' : '설정을 마쳤어요. 이제 선생님들은 비밀번호로 로그인할 수 있어요.' })
    } catch (error) { setMessage({ kind: 'error', text: error instanceof Error ? error.message : '설정하지 못했어요.' }) }
    finally { setBusy(false) }
  }

  async function save(next: (current: Article[]) => Article[], commitMessage: string, done: string) {
    setBusy(true); setMessage(null)
    try {
      const { articles, sha } = await readTeacherArticles(token)
      const updated = next(articles)
      await writeTeacherArticles(token, updated, sha, commitMessage)
      setMine(updated); onSaved(updated)
      setMessage({ kind: 'ok', text: done })
      return true
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : '저장하지 못했어요.' })
      return false
    } finally { setBusy(false) }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget); const get = (key: string) => String(f.get(key) || '').trim()
    const lines = (key: string) => get(key).split('\n').map(line => line.trim()).filter(Boolean).map(line => line.split('|').map(part => part.trim()))
    const words = lines('words').map(([word, meaning, example = '']) => ({ word, meaning, example }))
    const grammar = lines('grammar').map(([title, explanation, example = '']) => ({ title, explanation, example }))
    if (words.some(w => !w.meaning) || grammar.some(g => !g.explanation)) { setMessage({ kind: 'error', text: '단어와 문법은 안내된 형식대로 | 로 구분해 주세요.' }); return }
    const content = get('content'); const category = get('category')
    const article: Article = { id: `teacher-${Date.now().toString(36)}`, title: get('title'), title_ko: get('title_ko'), category, source: get('source'), source_url: get('source_url'), published_at: get('published_at'), collection_day: get('collection_day'), reading_minutes: Number(get('reading_minutes')) || 3, level: get('level'), cover_color: coverFor[category] || 'peach', excerpt: get('excerpt') || content.split(/(?<=[.!?])\s/)[0].slice(0, 160), content, translation_ko: get('translation_ko'), summary: get('summary'), words, grammar, content_kind: 'manual', created_at: new Date().toISOString() }
    const filled = withLearning(article)
    if (await save(current => [filled, ...current], `Teacher article: ${article.title}`, `'${article.title}' 기사를 올렸어요. 1~2분 뒤 학생 화면에 반영돼요.`)) formRef.current?.reset()
  }

  // Fills the word/grammar boxes from the article text so the teacher can review and edit them.
  function autofill() {
    const form = formRef.current; if (!form) return
    const field = (name: string) => form.elements.namedItem(name) as HTMLTextAreaElement
    const content = field('content').value
    if (!content.trim()) { setMessage({ kind: 'error', text: '먼저 영어 본문을 입력해 주세요.' }); return }
    field('words').value = extractWords(content).map(w => `${w.word} | ${w.meaning} | ${w.example}`).join('\n')
    field('grammar').value = extractGrammar(content).map(g => `${g.title} | ${g.explanation} | ${g.example}`).join('\n')
    setMessage({ kind: 'ok', text: '본문에서 단어와 문법을 골랐어요. 확인하고 필요하면 고쳐 주세요.' })
  }

  const remove = (article: Article) => { if (confirm(`'${article.title}' 기사를 삭제할까요?`)) save(current => current.filter(a => a.id !== article.id), `Remove teacher article: ${article.title}`, '삭제했어요. 1~2분 뒤 학생 화면에서도 사라져요.') }

  return <section className="teacher">
    <div className="page-head"><span className="kicker">TEACHERS ONLY</span><h1>선생님 전용</h1><p>학생들에게 보여 줄 기사와 학습 자료를 직접 올리고 관리해요.</p></div>
    {message && <p className={`teacher-message ${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>{message.kind === 'ok' ? <CheckCircle2 size={17}/> : <X size={17}/>} {message.text}</p>}
    {checking || box === undefined ? <div className="empty-state">확인하고 있어요...</div> : !token ? (box && !setup ? <div className="teacher-login single">
      <form className="modal-form teacher-card" onSubmit={signIn}>
        <h2><LogIn size={20}/> 선생님 로그인</h2>
        <p className="hint">선생님 비밀번호를 입력해 주세요.</p>
        <label>비밀번호<input name="password" type="password" autoComplete="current-password" required autoFocus/></label>
        <button className="primary-button" disabled={busy}><LogIn size={16}/>{busy ? '확인 중...' : '로그인'}</button>
        <button type="button" className="logout-link" onClick={() => { setSetup(true); setMessage(null) }}>관리자: 로그인 다시 설정하기 (토큰 만료·비밀번호 분실 시)</button>
      </form>
    </div> : <div className="teacher-login">
      <form className="modal-form teacher-card" onSubmit={e => configure(e)}>
        <h2><LogIn size={20}/> {box ? '로그인 다시 설정하기' : '처음 한 번만: 선생님 로그인 설정'}</h2>
        <p className="hint">사이트 관리자가 GitHub 토큰을 한 번 등록하고 선생님 비밀번호를 정해요. 토큰은 비밀번호로 암호화되어 저장되고, 이후에는 비밀번호만으로 로그인해요.</p>
        <label>GitHub 토큰<input name="token" type="password" autoComplete="off" placeholder="github_pat_..." required/></label>
        <div className="form-row"><label>선생님 비밀번호 <small>{MIN_PASSWORD}자 이상</small><input name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required/></label><label>비밀번호 확인<input name="confirm" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required/></label></div>
        <button className="primary-button" disabled={busy}>{busy ? '설정하는 중...' : '설정 저장'}</button>
        {box && <button type="button" className="logout-link" onClick={() => setSetup(false)}>비밀번호 로그인으로 돌아가기</button>}
      </form>
      <div className="teacher-card teacher-guide">
        <h2>GitHub 토큰 만들기</h2>
        <ol>
          <li>저장소 주인 계정으로 GitHub에 로그인한 뒤 <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">새 토큰 만들기 <ArrowUpRight size={12}/></a>를 열어요.</li>
          <li><b>Repository access</b>에서 <b>Only select repositories</b> → <code>{REPO.split('/')[1]}</code>만 선택해요.</li>
          <li><b>Permissions → Contents</b>를 <b>Read and write</b>로 바꿔요.</li>
          <li>만료일을 정해 생성하고, 왼쪽에 붙여 넣어요. 만료되면 이 화면에서 다시 설정하면 돼요.</li>
        </ol>
        <p className="hint">비밀번호는 다른 사람이 추측하기 어렵게 정하고, 선생님들께만 알려 주세요. 비밀번호를 아는 사람은 기사를 올리고 지울 수 있어요.</p>
      </div>
    </div>) : <>
      <div className="teacher-bar"><span><GraduationCap size={18}/> 선생님으로 로그인했어요</span><button className="text-link" onClick={logout}><LogOut size={16}/> 로그아웃</button></div>
      <div className="teacher-tabs" role="tablist"><button role="tab" aria-selected={section === 'summaries'} className={section === 'summaries' ? 'active' : ''} onClick={() => setSection('summaries')}><MessageSquare size={16}/> 학생 요약</button><button role="tab" aria-selected={section === 'articles'} className={section === 'articles' ? 'active' : ''} onClick={() => setSection('articles')}><Plus size={16}/> 기사 올리기·관리</button></div>
      {section === 'summaries' ? <StudentSummaries token={token}/> : <>
      <div className="teacher-grid">
        <form ref={formRef} className="modal-form teacher-card" onSubmit={submit}>
          <h2><Plus size={20}/> 새 기사 올리기</h2>
          <p className="hint">게시일에 맞춰 그날의 신문에 실려요. 같은 분야의 자동 수집 기사보다 먼저 보여요.</p>
          <div className="form-row three"><label>분야<select name="category">{sections.map(s => <option key={s.name}>{s.name}</option>)}</select></label><label>난이도<select name="level" defaultValue="LEVEL 2">{levels.slice(1).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>읽기 시간(분)<input name="reading_minutes" type="number" min="1" defaultValue="3" required/></label></div>
          <div className="form-row"><label>게시일 (신문 날짜)<input name="collection_day" type="date" defaultValue={seoulToday()} required/></label><label>원문 발행일<input name="published_at" type="date" defaultValue={seoulToday()} required/></label></div>
          <div className="form-row"><label>영어 제목<input name="title" required/></label><label>한국어 제목 <small>선택</small><input name="title_ko"/></label></div>
          <div className="form-row"><label>출처<input name="source" required placeholder="신문사 또는 학교 이름"/></label><label>원문 링크 <small>선택</small><input name="source_url" type="url" placeholder="https://"/></label></div>
          <label>한 줄 소개 <small>비우면 본문 첫 문장을 써요</small><input name="excerpt"/></label>
          <label>영어 본문<textarea name="content" required rows={8} placeholder="문단은 줄을 바꿔 구분해요."/></label>
          <label>한국어 번역 <small>번역 단계에서 보여요</small><textarea name="translation_ko" rows={5}/></label>
          <label>핵심 요약 <small>선택</small><textarea name="summary" rows={2}/></label>
          <div className="autofill"><span>단어·문법을 비워 두면 본문에서 자동으로 골라요. 미리 보고 고치려면:</span><button type="button" className="chip" onClick={autofill}><Sparkles size={14}/> 본문에서 자동 채우기</button></div>
          <label>단어 <small>한 줄에 하나: 단어 | 뜻 | 예문</small><textarea name="words" rows={3} placeholder="inspire | 영감을 주다 | The story inspired me."/></label>
          <label>문법 <small>한 줄에 하나: 제목 | 설명 | 예문</small><textarea name="grammar" rows={3} placeholder="관계대명사 that | 앞의 명사를 꾸며 줘요. | The book that I read."/></label>
          <p className="hint">외부 기사는 저작권과 이용 조건을 확인한 뒤 올려 주세요.</p>
          <button className="primary-button" disabled={busy}><Plus size={17}/>{busy ? '올리는 중...' : '기사 올리기'}</button>
        </form>
        <div className="teacher-side">
        <div className="teacher-card">
          <h2>올린 기사 <span className="nav-count">{mine.length}</span></h2>
          {mine.length === 0 ? <p className="hint">아직 올린 기사가 없어요.</p> : <ul className="teacher-list">{mine.map(a => <li key={a.id} className={`tone-${sectionOf(a.category).tone}`}><div><span className="card-kicker"><span className="section-tag">{a.category}</span><span className="level-tag">{formatDay(a.collection_day || a.published_at)}</span></span><b>{a.title}</b></div><button className="icon-button" disabled={busy} onClick={() => remove(a)} aria-label={`${a.title} 삭제`}><X size={16}/></button></li>)}</ul>}
        </div>
        <form className="modal-form teacher-card teacher-password" onSubmit={e => configure(e, token)}>
          <h2>비밀번호 바꾸기</h2>
          <label>새 비밀번호 <small>{MIN_PASSWORD}자 이상</small><input name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required/></label>
          <label>새 비밀번호 확인<input name="confirm" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required/></label>
          <button className="primary-button" disabled={busy}>비밀번호 바꾸기</button>
        </form>
        </div>
      </div>
      </>}
    </>}
  </section>
}

// Teacher view of student summaries stored in the Google Sheet, with a comment box per summary.
function StudentSummaries({ token }: { token: string }) {
  const [config, setConfig] = useState<FeedbackConfig | null | undefined>(undefined)
  const [key, setKey] = useState('')
  const [setup, setSetup] = useState(false)
  const [items, setItems] = useState<Submission[] | null>(null)
  const [filter, setFilter] = useState<'waiting' | 'all'>('waiting')
  const [query, setQuery] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [newKey] = useState(newTeacherKey)
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchFeedbackConfig(import.meta.env.BASE_URL).then(async found => {
      setConfig(found)
      if (!found?.keyBox) return
      // The sheet key is stored encrypted with the repo token, which only a logged-in teacher has.
      try { const k = await unlockToken(found.keyBox, token); setKey(k); load(found, k) } catch { setSetup(true) }
    })
  }, [token])

  async function load(c = config, k = key) {
    if (!c || !k) return
    setBusy(true); setMessage(null)
    try { setItems(await fetchAll(c.url, k)) } catch (error) { setMessage({ kind: 'error', text: error instanceof Error ? error.message : '불러오지 못했어요.' }) } finally { setBusy(false) }
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault()
    const target = url.trim()
    if (!isWebAppUrl(target)) { setMessage({ kind: 'error', text: '웹 앱 URL은 https://script.google.com/macros/s/.../exec 형태예요.' }); return }
    setBusy(true); setMessage(null)
    try {
      const pong = await pingTeacher(target, newKey).catch(() => ({ ok: false }))
      if (!pong.ok) throw new Error('연결은 됐지만 키가 맞지 않아요. 아래 코드를 그대로 붙여 넣고 "새 배포"를 다시 했는지 확인해 주세요.')
      const next: FeedbackConfig = { v: 1, url: target, keyBox: await lockToken(newKey, token, 20000) }
      await savePublicJson(token, CONFIG_FILE, next, 'Connect student summaries')
      setConfig(next); setKey(newKey); setSetup(false); setUrl('')
      await load(next, newKey)
      setMessage({ kind: 'ok', text: '연결했어요! 1~2분 뒤부터 학생들이 요약을 제출할 수 있어요.' })
    } catch (error) { setMessage({ kind: 'error', text: error instanceof Error ? error.message : '연결하지 못했어요.' }) }
    finally { setBusy(false) }
  }

  async function comment(item: Submission) {
    if (!config) return
    const text = (drafts[item.id] ?? item.feedback).trim()
    setSaving(item.id); setMessage(null)
    try {
      const { feedbackAt } = await saveComment(config.url, key, item.id, text)
      setItems(prev => prev && prev.map(x => x.id === item.id ? { ...x, feedback: text, feedbackAt } : x))
      setDrafts(prev => { const next = { ...prev }; delete next[item.id]; return next })
    } catch (error) { setMessage({ kind: 'error', text: error instanceof Error ? error.message : '저장하지 못했어요.' }) }
    finally { setSaving('') }
  }

  const script = scriptSource.replace('__TEACHER_KEY__', newKey)
  const copyScript = async () => { try { await navigator.clipboard.writeText(script); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setCopied(false) } }

  if (config === undefined) return <div className="empty-state">연결 상태를 확인하고 있어요...</div>
  if (!config || setup || !key) return <div className="teacher-card summary-setup">
    {message && <p className={`teacher-message ${message.kind}`} role="status">{message.text}</p>}
    <h2><MessageSquare size={20}/> {config ? '요약 저장소 다시 연결하기' : '처음 한 번만: 학생 요약 저장소 연결'}</h2>
    <p className="hint">학생 요약은 선생님의 구글 스프레드시트에 저장돼요. 아래 순서대로 한 번만 연결하면 돼요. (약 5분)</p>
    <ol className="setup-steps">
      <li><a href={SHEET_URL} target="_blank" rel="noopener noreferrer">연결할 구글 스프레드시트 열기 <ArrowUpRight size={12}/></a> (Daily Scoop 요약 시트). 공유 설정은 <b>제한됨</b>으로 두세요. 링크가 있는 모든 사용자에게 공개하면 학생 요약이 누구에게나 보여요.</li>
      <li>메뉴 <b>확장 프로그램 → Apps Script</b>를 열어요.</li>
      <li>편집기의 코드를 모두 지우고, 아래 코드를 복사해 붙여 넣은 뒤 저장(💾)해요. <b>선생님 키가 이미 들어 있으니 고치지 마세요.</b>
        <div className="code-box"><button type="button" className="chip" onClick={copyScript}><Copy size={14}/> {copied ? '복사했어요!' : '코드 복사'}</button><textarea readOnly value={script} rows={6} aria-label="Apps Script 코드"/></div></li>
      <li><b>배포 → 새 배포</b> → 유형 선택(⚙)에서 <b>웹 앱</b> → 실행 사용자: <b>나</b>, 액세스 권한: <b>모든 사용자</b> → 배포. 권한 확인 창이 뜨면 승인해요.</li>
      <li>나온 <b>웹 앱 URL</b>을 복사해 아래에 붙여 넣어요.</li>
    </ol>
    <form className="modal-form" onSubmit={connect}>
      <label>웹 앱 URL<input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" required/></label>
      <button className="primary-button" disabled={busy}>{busy ? '연결 확인 중...' : '연결 확인하고 저장'}</button>
      {config && <button type="button" className="logout-link" onClick={() => setSetup(false)}>취소</button>}
    </form>
    <p className="hint">요약에는 학생 이름이 들어가요. 학교의 개인정보 처리 지침을 확인해 주세요. 스프레드시트를 지우면 제출 기록도 함께 지워져요.</p>
  </div>

  const all = items || []
  const shown = all.filter(i => (filter === 'all' || !i.feedback) && `${i.name} ${i.className} ${i.articleTitle} ${i.summary}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const waiting = all.filter(i => !i.feedback).length
  return <div className="summaries">
    {message && <p className={`teacher-message ${message.kind}`} role="status">{message.text}</p>}
    <div className="filters">
      <div className="chip-row"><button className={`chip ${filter === 'waiting' ? 'active' : ''}`} onClick={() => setFilter('waiting')}>피드백 대기 {waiting}</button><button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>전체 {all.length}</button></div>
      <div className="filter-tools"><label className="search-box"><Search size={16}/><input aria-label="요약 검색" placeholder="이름, 기사 검색" value={query} onChange={e => setQuery(e.target.value)}/></label><button className="chip" onClick={() => load()} disabled={busy}><RefreshCw size={14}/> {busy ? '불러오는 중' : '새로고침'}</button></div>
    </div>
    {items === null ? <div className="empty-state">{busy ? '학생 요약을 불러오고 있어요...' : '불러오지 못했어요. 새로고침을 눌러 주세요.'}</div> : shown.length === 0 ? <div className="empty-state">{filter === 'waiting' && all.length ? '모든 요약에 피드백을 남겼어요! 👏' : '아직 제출된 요약이 없어요.'}</div> :
      <ul className="row-list">{shown.map(item => { const draft = drafts[item.id] ?? item.feedback; const dirty = draft.trim() !== item.feedback; return <li key={item.id} className="my-submission">
        <div className="sub-head"><b>{item.name}{item.className && <small> · {item.className}</small>}</b><span>{formatTime(item.submittedAt)}</span></div>
        <p className="sub-article">{item.articleTitle}</p>
        <p className="sub-text">{item.summary}</p>
        <div className="comment-box"><label className="field-label" htmlFor={`c-${item.id}`}><MessageSquare size={15}/> 피드백 댓글{item.feedbackAt && <small> · {formatTime(item.feedbackAt)} 저장됨</small>}</label>
          <textarea id={`c-${item.id}`} className="note-area comment-area" maxLength={2000} placeholder="잘한 점과 고칠 점을 학생에게 남겨 주세요." value={draft} onChange={e => setDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}/>
          <button className="primary-button" disabled={!dirty || saving === item.id} onClick={() => comment(item)}><Send size={16}/> {saving === item.id ? '저장 중...' : item.feedback ? '댓글 수정' : '댓글 달기'}</button></div>
      </li> })}</ul>}
    <p className="hint">학생 요약은 <a href={SHEET_URL} target="_blank" rel="noopener noreferrer">연결된 구글 스프레드시트</a>에서도 볼 수 있어요. <button className="logout-link" onClick={() => setSetup(true)}>저장소 다시 연결하기</button></p>
  </div>
}


createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
