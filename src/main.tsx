import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Check, CheckCircle2, Clock3, FlaskConical, Globe, GraduationCap, Leaf, LogIn, LogOut, Palette, Plus, School, Search, Sparkles, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { Article, demoArticles } from './data'
import { requestSummaryFeedback, type SummaryFeedback } from './summary-feedback'
import { translationParagraphs } from './translation.mjs'
import { supabase } from './supabase'
import './style.css'

type Tab = 'article' | 'summary' | 'words' | 'grammar' | 'translation'
type Modal = 'login' | 'upload' | null
type View = 'home' | 'archive' | 'saved'

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
const editionDay = (a: Article) => a.collection_day || a.published_at
const byNewest = (a: Article, b: Article) => editionDay(b).localeCompare(editionDay(a)) || (b.created_at || '').localeCompare(a.created_at || '')
const formatDay = (day: string, withWeekday = false) => { const d = new Date(`${day}T00:00:00`); return Number.isNaN(d.getTime()) ? day : new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', ...(withWeekday ? { weekday: 'long' } : {}) }).format(d) }
const readStorage = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback } }
const writeStorage = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ } }

function Cover({ category, big = false }: { category: string; big?: boolean }) {
  const section = sectionOf(category); const Icon = section.icon
  return <div className={`cover tone-${section.tone} ${big ? 'cover-big' : ''}`} aria-hidden="true"><Icon className="cover-icon" size={big ? 120 : 72} strokeWidth={1.25}/><span className="cover-en">{section.en}</span></div>
}

function App() {
  const [articles, setArticles] = useState<Article[]>(supabase ? [] : demoArticles)
  const [loading, setLoading] = useState(!!supabase)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Article | null>(null)
  const [tab, setTab] = useState<Tab>('article')
  const [category, setCategory] = useState('전체')
  const [level, setLevel] = useState('전체')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('home')
  const [saved, setSaved] = useState<string[]>(() => readStorage('scoop-saved', []))
  const [completed, setCompleted] = useState<string[]>(() => readStorage('scoop-completed', []))
  const [notes, setNotes] = useState<Record<string, string>>(() => readStorage('scoop-notes', {}))
  const [summaryFeedback, setSummaryFeedback] = useState<SummaryFeedback | null>(null)
  const [feedbackError, setFeedbackError] = useState('')
  const [feedbackBusy, setFeedbackBusy] = useState(false)
  const [feedbackConsent, setFeedbackConsent] = useState(false)
  const feedbackRequest = useRef(0)
  const [revealed, setRevealed] = useState<number[]>([])
  const [modal, setModal] = useState<Modal>(null)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => { writeStorage('scoop-saved', saved) }, [saved])
  useEffect(() => { writeStorage('scoop-completed', completed) }, [completed])
  useEffect(() => { writeStorage('scoop-notes', notes) }, [notes])
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    loadArticles()
    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadArticles() {
    if (!supabase) return
    setLoading(true); setError('')
    const { data, error: fetchError } = await supabase.from('articles').select('*').order('published_at', { ascending: false }).order('created_at', { ascending: false })
    if (fetchError) setError('기사를 불러오지 못했어요. Supabase 설정을 확인해 주세요.')
    else setArticles((data || []) as Article[])
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

  const resetFeedback = () => { feedbackRequest.current++; setSummaryFeedback(null); setFeedbackError(''); setFeedbackBusy(false) }
  const openArticle = (article: Article, nextTab: Tab = 'article') => { resetFeedback(); setSelected(article); setTab(nextTab); setRevealed([]); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const navigate = (next: View, nextCategory = '전체') => { resetFeedback(); setView(next); setSelected(null); setCategory(nextCategory); setLevel('전체'); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const isTeacher = !!session && !session.user.is_anonymous
  async function checkSummary(article: Article) {
    const text = (notes[article.id] || '').trim()
    if (!feedbackConsent || text.length < 5 || feedbackBusy) return
    const request = ++feedbackRequest.current
    setFeedbackBusy(true); setFeedbackError(''); setSummaryFeedback(null)
    try {
      const result = await requestSummaryFeedback(article.id, text)
      if (feedbackRequest.current === request) setSummaryFeedback(result)
    } catch (error) {
      if (feedbackRequest.current === request) setFeedbackError(error instanceof Error ? error.message : '피드백을 불러오지 못했어요.')
    } finally {
      if (feedbackRequest.current === request) setFeedbackBusy(false)
    }
  }
  const toggleSaved = (id: string) => setSaved(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  const markDone = (id: string) => setCompleted(prev => prev.includes(id) ? prev : [...prev, id])
  const today = formatDay(new Date().toLocaleDateString('en-CA'), true)
  const goTab = (next: Tab) => { setTab(next); setRevealed([]); document.querySelector('.reader-steps')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }

  const saveButton = (article: Article) => <button className={`save-button ${saved.includes(article.id) ? 'is-saved' : ''}`} onClick={() => toggleSaved(article.id)} aria-label={saved.includes(article.id) ? '저장 취소' : '기사 저장'} aria-pressed={saved.includes(article.id)}><Bookmark size={17} fill={saved.includes(article.id) ? 'currentColor' : 'none'}/></button>

  return <div className="app">
    <header className="masthead">
      <div className="mast-bar">
        <span className="mast-date">{today}</span>
        <span className="mast-note"><Clock3 size={13}/> 매일 아침 8시 · 5개 분야 5편</span>
        <button className="teacher-button" onClick={() => setModal(isTeacher ? 'upload' : 'login')}><GraduationCap size={15}/>{isTeacher ? '기사 등록' : '선생님'}</button>
      </div>
      <button className="wordmark" onClick={() => navigate('home')} aria-label="Daily Scoop 홈"><span className="wordmark-the">The</span> Daily Scoop</button>
      <p className="tagline">세상을 읽는 하루 다섯 편의 영어 뉴스</p>
      <nav className="mast-nav" aria-label="주 메뉴">
        <button className={view === 'home' && !selected ? 'active' : ''} onClick={() => navigate('home')}>오늘의 신문</button>
        {sections.map(s => <button key={s.name} className={`nav-section tone-${s.tone} ${view === 'archive' && !selected && category === s.name ? 'active' : ''}`} onClick={() => navigate('archive', s.name)}>{s.name}</button>)}
        <button className={view === 'archive' && !selected && category === '전체' ? 'active' : ''} onClick={() => navigate('archive')}>지난 기사</button>
        <button className={view === 'saved' && !selected ? 'active' : ''} onClick={() => navigate('saved')}>저장함{saved.length > 0 && <span className="nav-count">{saved.length}</span>}</button>
      </nav>
    </header>

    <main className="main">
      {selected ? Reader() : view === 'home' ? Home() : Archive()}
    </main>

    <footer className="footer"><span className="footer-mark">The Daily Scoop</span><p>기사는 공개 RSS에서 매일 수집되며 원문 저작권은 각 출처에 있어요. 학습 완료와 요약은 이 브라우저에만 저장돼요.</p></footer>
    {modal === 'login' && <LoginModal onClose={() => setModal(null)} onLogin={() => setModal('upload')} session={isTeacher ? session : null} onLogout={() => supabase?.auth.signOut()}/>}
    {modal === 'upload' && <UploadModal onClose={() => setModal(null)} onCreated={() => { setModal(null); loadArticles() }} onLogout={() => { supabase?.auth.signOut(); setModal(null) }}/>}
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
      {!supabase && <p className="notice"><Sparkles size={15}/> <span><b>예시 모드</b> · 실제 보도를 참고해 새로 작성한 연습 지문이에요. Supabase를 연결하면 매일 아침 5개 분야 기사가 자동으로 채워져요.</span></p>}

      {lead && <article className={`lead tone-${sectionOf(lead.category).tone}`}>
        <button className="lead-cover" onClick={() => openArticle(lead)} aria-label={`${lead.title} 읽기`}><Cover category={lead.category} big/></button>
        <div className="lead-copy">
          <div className="card-kicker"><span className="section-tag">{lead.category}</span><span className="level-tag">{levelLabel(lead.level)}</span>{completed.includes(lead.id) && <span className="done-tag"><CheckCircle2 size={13}/> 완료</span>}</div>
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
          <div className="card-kicker"><span className="section-tag">{article.category}</span><span className="level-tag">{levelShort(article.level)}</span>{completed.includes(article.id) && <span className="done-tag"><CheckCircle2 size={13}/></span>}</div>
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
          <button className="row-main" onClick={() => openArticle(article)}><span className="card-kicker"><span className="section-tag">{article.category}</span><span className="level-tag">{levelShort(article.level)}</span>{completed.includes(article.id) && <span className="done-tag"><CheckCircle2 size={13}/> 완료</span>}</span><span className="row-title">{article.title}</span><span className="row-excerpt">{article.excerpt}</span><span className="card-meta"><span>{article.source}</span><span>{article.reading_minutes}분 읽기</span></span></button>
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
        {a.content_kind === 'rss_excerpt' && <p className="disclaimer">자동 수집된 짧은 피드 발췌문이에요. 전체 기사와 맥락은 출처 링크에서 확인하세요. 난이도는 자동 추정치이며, 학습 자료가 아직 없을 수 있어요.</p>}
        {a.content_kind === 'ai_generated' && <p className="disclaimer">공개 피드를 바탕으로 AI가 작성한 학습 지문이에요. 오류가 있을 수 있으니 원문과 대조해 주세요.</p>}
      </header>
      <nav className="reader-steps" aria-label="학습 단계">{steps.map(([id, ko], i) => <button key={id} className={`${tab === id ? 'active' : ''} ${i < stepIndex ? 'past' : ''}`} aria-current={tab === id ? 'step' : undefined} onClick={() => goTab(id)}><span>{i + 1}</span>{ko}</button>)}</nav>
      <div className="reader-body">
        {tab === 'article' && <><StepHead no={1} title="차근차근 읽어 볼까요?" help="모르는 단어가 나와도 괜찮아요. 전체 흐름을 먼저 잡아 보세요."/><div className="article-copy">{a.content.split(/\n+/).filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div><NextBar text="다 읽었다면 내 말로 정리해 봐요." label="요약하기" onClick={() => goTab('summary')}/></>}
        {tab === 'summary' && <><StepHead no={2} title="나만의 문장으로 요약해요" help="가장 중요한 내용을 영어 또는 한국어로 자유롭게 적어 보세요."/><label className="field-label" htmlFor="summary-note">내가 정리한 내용</label><textarea id="summary-note" className="note-area" maxLength={3000} placeholder="이 기사는 어떤 이야기인가요?" value={notes[a.id] || ''} onChange={e => { setNotes({ ...notes, [a.id]: e.target.value }); resetFeedback() }}/><p className="hint">요약은 이 브라우저에 자동 저장돼요. 5자 이상 작성해 주세요.</p><label className="consent"><input type="checkbox" checked={feedbackConsent} onChange={e => setFeedbackConsent(e.target.checked)}/><span>AI 피드백을 위해 요약과 기사 내용이 OpenAI에 전송되는 것에 동의해요. 이름 등 개인정보는 입력하지 마세요.</span></label><button className="primary-button" disabled={!feedbackConsent || (notes[a.id] || '').trim().length < 5 || feedbackBusy} onClick={() => checkSummary(a)}><Check size={17}/> {feedbackBusy ? '피드백을 분석하고 있어요...' : '요약 확인하기'}</button>{feedbackError && <p className="form-error" role="alert">{feedbackError}</p>}{summaryFeedback && <section className="summary-feedback" aria-live="polite" aria-label="요약 피드백"><div className="feedback-heading"><Sparkles size={19}/><div><h3>나의 요약 피드백</h3><p>AI 분석 결과는 틀릴 수 있어요. 기사 원문과 함께 확인하고 필요하면 선생님께 질문해 보세요.</p></div></div><p className="feedback-overall">{summaryFeedback.overall}</p><div className="feedback-list"><FeedbackSection number="01" title="어휘의 적절성" section={summaryFeedback.vocabulary}/><FeedbackSection number="02" title="문법과 문장" section={summaryFeedback.grammar}/><FeedbackSection number="03" title="의미와 핵심 내용" section={summaryFeedback.meaning}/></div>{summaryFeedback.revised_summary && <div className="feedback-revision"><h4>이렇게 다듬어 볼 수 있어요</h4><p>{summaryFeedback.revised_summary}</p></div>}</section>}<NextBar text="핵심 단어를 익혀 볼까요?" label="단어 학습" onClick={() => goTab('words')}/></>}
        {tab === 'words' && <><StepHead no={3} title="오늘의 단어" help="카드를 눌러 뜻과 예문을 확인해 보세요."/><div className="word-grid">{a.words?.length ? a.words.map((word, i) => <button className={`word-card ${revealed.includes(i) ? 'revealed' : ''}`} key={i} aria-expanded={revealed.includes(i)} onClick={() => setRevealed(revealed.includes(i) ? revealed.filter(n => n !== i) : [...revealed, i])}><span className="word-no">{String(i + 1).padStart(2, '0')}</span><strong>{word.word}</strong>{revealed.includes(i) ? <><b>{word.meaning}</b><em>{word.example}</em></> : <small>눌러서 뜻 보기</small>}</button>) : <p className="empty-state">아직 등록된 단어가 없어요.</p>}</div><NextBar text="문장 속 문법도 살펴봐요." label="문법 보기" onClick={() => goTab('grammar')}/></>}
        {tab === 'grammar' && <><StepHead no={4} title="문장 속 문법" help="기사에서 만난 표현을 하나씩 알아볼까요?"/><div className="grammar-list">{a.grammar?.length ? a.grammar.map((item, i) => <div className="grammar-card" key={i}><span className="grammar-number">{String(i + 1).padStart(2, '0')}</span><div><h3>{item.title}</h3><p>{item.explanation}</p><blockquote>{item.example}</blockquote></div></div>) : <p className="empty-state">아직 등록된 문법 설명이 없어요.</p>}</div><div className="complete-box"><div><b>{completed.includes(a.id) ? '학습을 완료했어요!' : '여기까지 왔다면 거의 끝!'}</b><span>완료 표시하면 오늘의 진행률에 반영돼요.</span></div><button className={`primary-button ${completed.includes(a.id) ? 'is-done' : ''}`} onClick={() => markDone(a.id)}><Check size={17}/> {completed.includes(a.id) ? '완료됨' : '학습 완료'}</button></div><NextBar text="마지막으로 한국어로 확인해요." label="번역 보기" onClick={() => goTab('translation')}/></>}
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

function FeedbackSection({ number, title, section }: { number: string; title: string; section: SummaryFeedback['vocabulary'] }) {
  return <div><span className="feedback-number">{number}</span><div><h4>{title}</h4><p>{section.comment}</p>{section.examples.map((example, i) => <div className="feedback-example" key={i}>{example.original && <p><b>작성한 표현</b> {example.original}</p>}{example.suggestion && <p><b>제안</b> {example.suggestion}</p>}{example.reason && <p><b>이유</b> {example.reason}</p>}</div>)}</div></div>
}

function ModalFrame({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><div><div className="section-kicker">FOR TEACHERS <span>✳</span></div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="닫기"><X size={20}/></button></div>{children}</div></div> }

function LoginModal({ onClose, onLogin, session, onLogout }: { onClose: () => void; onLogin: () => void; session: Session | null; onLogout: () => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) { e.preventDefault(); if (!supabase) { setMessage('Supabase 환경 변수를 먼저 설정해 주세요.'); return } setBusy(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); setBusy(false); if (error) setMessage('로그인에 실패했어요. 이메일과 비밀번호를 확인해 주세요.'); else onLogin() }
  return <ModalFrame title="선생님 로그인" subtitle="로그인하고 새로운 학습 기사를 등록해 주세요." onClose={onClose}>{session ? <button className="primary-button" onClick={onLogout}><LogOut size={16}/> 로그아웃</button> : <form className="modal-form" onSubmit={submit}><label>이메일<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@school.com"/></label><label>비밀번호<input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 입력"/></label>{message && <p className="form-error">{message}</p>}<button className="primary-button" disabled={busy}><LogIn size={16}/>{busy ? '로그인 중...' : '로그인'}</button>{!supabase && <p className="save-hint">현재 예시 모드입니다. README의 Supabase 설정을 확인해 주세요.</p>}</form>}</ModalFrame>
}

function UploadModal({ onClose, onCreated, onLogout }: { onClose: () => void; onCreated: () => void; onLogout: () => void }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!supabase) return
    const f = new FormData(e.currentTarget); const get = (key: string) => String(f.get(key) || '').trim()
    const lines = (key: string) => get(key).split('\n').map(line => line.trim()).filter(Boolean).map(line => line.split('|').map(part => part.trim()))
    const words = lines('words').map(([word, meaning, example = '']) => ({ word, meaning, example }))
    const grammar = lines('grammar').map(([title, explanation, example = '']) => ({ title, explanation, example }))
    if (words.some(w => !w.meaning) || grammar.some(g => !g.explanation)) { setMessage('단어와 문법은 안내된 형식대로 | 로 구분해 주세요.'); return }
    setBusy(true); setMessage('')
    const { error } = await supabase.from('articles').insert({ title: get('title'), title_ko: get('title_ko'), category: get('category'), source: get('source'), source_url: get('source_url'), published_at: get('published_at'), reading_minutes: Number(get('reading_minutes')), level: get('level'), cover_color: get('cover_color'), excerpt: get('excerpt'), content: get('content'), translation_ko: get('translation_ko'), summary: get('summary'), words, grammar })
    setBusy(false); if (error) setMessage(`등록하지 못했어요: ${error.message}`); else onCreated()
  }
  return <ModalFrame title="새 기사 등록" subtitle="기사와 함께 학생들을 위한 학습 자료를 올려주세요." onClose={onClose}><form className="modal-form upload-form" onSubmit={submit}><div className="form-row"><label>영어 제목<input name="title" required /></label><label>한국어 제목 (검색용, 선택)<input name="title_ko" /></label></div><div className="form-row"><label>출처<input name="source" required placeholder="신문 또는 학교 이름"/></label><label>원문 링크<input name="source_url" type="url" placeholder="https:// (선택)"/></label></div><div className="form-row three"><label>카테고리<select name="category">{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label>추천 수준<select name="level" defaultValue="LEVEL 2">{levels.slice(1).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>읽기 시간 (분)<input name="reading_minutes" type="number" min="1" defaultValue="4" required/></label></div><div className="form-row"><label>발행일<input name="published_at" type="date" defaultValue={new Date().toLocaleDateString('en-CA')} required/></label><label>표지 스타일<select name="cover_color"><option value="sage">초록 정원</option><option value="blue">푸른 바다</option><option value="peach">따뜻한 하늘</option><option value="lilac">보랏빛</option><option value="coral">산호빛</option></select></label></div><label>영어 한 줄 소개<input name="excerpt"/></label><label>기사 본문<textarea name="content" required rows={7}/></label><label>한국어 본문 번역 <small>학습자가 번역 탭에서 확인할 수 있어요.</small><textarea name="translation_ko" rows={7} placeholder="영어 본문 전체를 한국어로 번역해 주세요."/></label><label>핵심 요약<textarea name="summary" rows={3}/></label><label>단어 학습 <small>한 줄에 하나씩: 단어 | 뜻 | 예문</small><textarea name="words" rows={3} placeholder="inspire | 영감을 주다 | The story inspired me."/></label><label>문법 학습 <small>한 줄에 하나씩: 문법 제목 | 설명 | 예문</small><textarea name="grammar" rows={3} placeholder="관계대명사 that | 앞의 명사를 꾸며줘요. | The book that I read."/></label><p className="save-hint">외부 기사는 이용 허락과 저작권을 확인한 후 등록해 주세요.</p>{message && <p className="form-error">{message}</p>}<div className="upload-actions"><button className="primary-button" disabled={busy}><Plus size={17}/>{busy ? '등록 중...' : '기사 등록하기'}</button><button type="button" className="logout-link" onClick={onLogout}>로그아웃</button></div></form></ModalFrame>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
