import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Bookmark, Check, CheckCircle2, ChevronDown, Clock3, Compass, GraduationCap, Highlighter, Leaf, LibraryBig, Lightbulb, LogIn, LogOut, Menu, Newspaper, Plus, Search, Sparkles, SpellCheck, X } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { Article, demoArticles } from './data'
import { requestSummaryFeedback, type SummaryFeedback } from './summary-feedback'
import { translationParagraphs } from './translation.mjs'
import { supabase } from './supabase'
import './style.css'

type Tab = 'article' | 'summary' | 'words' | 'grammar' | 'translation'
type Modal = 'login' | 'upload' | null
const categories = ['전체', '환경', '과학', '생활', '문화', '세상']
const levels = [{ value: '전체', label: '전체 수준' }, { value: 'LEVEL 1', label: 'LEVEL 1 · 기초' }, { value: 'LEVEL 2', label: 'LEVEL 2 · 보통' }, { value: 'LEVEL 3', label: 'LEVEL 3 · 도전' }]
const levelLabel = (level: string) => levels.find(item => item.value === level)?.label || level
const images: Record<string, string> = {
  sage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=85',
  blue: 'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?auto=format&fit=crop&w=900&q=80',
  peach: 'https://images.unsplash.com/photo-1511295742362-92c96b9bf484?auto=format&fit=crop&w=900&q=80',
}
const readStorage = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback } }

function App() {
  const [articles, setArticles] = useState<Article[]>(supabase ? [] : demoArticles)
  const [loading, setLoading] = useState(!!supabase)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Article | null>(null)
  const [tab, setTab] = useState<Tab>('article')
  const [category, setCategory] = useState('전체')
  const [level, setLevel] = useState('전체')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'home' | 'articles' | 'saved'>('home')
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
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => { localStorage.setItem('scoop-saved', JSON.stringify(saved)) }, [saved])
  useEffect(() => { localStorage.setItem('scoop-completed', JSON.stringify(completed)) }, [completed])
  useEffect(() => { localStorage.setItem('scoop-notes', JSON.stringify(notes)) }, [notes])
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
  const filtered = useMemo(() => (view === 'home' ? articles.slice(0, 5) : articles).filter(a => (category === '전체' || a.category === category) && (level === '전체' || a.level === level) && (view !== 'saved' || saved.includes(a.id)) && `${a.title} ${a.title_ko} ${a.category} ${a.source}`.toLowerCase().includes(search.toLowerCase())), [articles, category, level, search, view, saved])
  const featured = articles[0]
  const resetFeedback = () => { feedbackRequest.current++; setSummaryFeedback(null); setFeedbackError(''); setFeedbackBusy(false) }
  const openArticle = (article: Article, nextTab: Tab = 'article') => { resetFeedback(); setSelected(article); setTab(nextTab); setRevealed([]); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const navigate = (next: 'home' | 'articles' | 'saved') => { resetFeedback(); setView(next); setSelected(null); setCategory('전체'); setLevel('전체'); setSearch(''); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
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
  const today = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <button className="brand" onClick={() => navigate('home')} aria-label="Daily Scoop 홈"><span className="brand-mark"><Newspaper size={22} strokeWidth={2.2}/></span><span>daily<span className="brand-dot">.</span><br/>scoop</span></button>
      <div className="sidebar-label">MENU</div>
      <nav className="side-nav">
        <button className={view === 'home' && !selected ? 'active' : ''} onClick={() => navigate('home')}><Compass size={19}/> 오늘의 홈</button>
        <button className={view === 'articles' && !selected ? 'active' : ''} onClick={() => navigate('articles')}><Newspaper size={19}/> 전체 기사</button>
        <button className={view === 'saved' && !selected ? 'active' : ''} onClick={() => navigate('saved')}><Bookmark size={19}/> 저장한 기사 <span className="nav-count">{saved.length}</span></button>
      </nav>
      <div className="sidebar-label learning-label">LEARNING</div>
      <nav className="side-nav">
        <button onClick={() => featured && openArticle(featured, 'summary')}><Highlighter size={19}/> 요약하기</button>
        <button onClick={() => featured && openArticle(featured, 'words')}><BookOpen size={19}/> 단어 학습</button>
        <button onClick={() => featured && openArticle(featured, 'grammar')}><SpellCheck size={19}/> 문법 살펴보기</button>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-illustration"><Sparkles size={19}/><span>조금씩 읽다 보면,<br/><b>어느새 영어가 쑥!</b></span></div><p>Made for curious minds <span>✳</span></p></div>
    </aside>

    <div className="page-wrap">
      <header className="topbar"><div className="top-left"><button className="mobile-menu" onClick={() => setMobileMenu(!mobileMenu)} aria-label="메뉴 열기"><Menu size={21}/></button><span className="top-date">{today}</span><span className="top-divider"/><span className="top-note">오늘도 한 걸음 더 성장하는 시간 <span>✳</span></span></div><div className="top-actions"><span className="edition">THE DAILY EDITION</span><button className="teacher-button" onClick={() => setModal(isTeacher ? 'upload' : 'login')}><span className="teacher-avatar"><GraduationCap size={16}/></span>{isTeacher ? '기사 등록' : '선생님'} <ChevronDown size={14}/></button></div></header>
      <main className="main-content">
        {selected ? <section className="reader">
          <div className="reader-top"><button className="back-button" onClick={() => { resetFeedback(); setSelected(null) }}><ArrowLeft size={17}/> 기사 목록으로</button><button className={`icon-button ${saved.includes(selected.id) ? 'is-saved' : ''}`} onClick={() => toggleSaved(selected.id)} aria-label="기사 저장"><Bookmark size={19} fill={saved.includes(selected.id) ? 'currentColor' : 'none'}/></button></div>
          <div className="reader-heading"><div className="eyebrow"><span className="status-dot"/> {selected.category} <span className="eyebrow-divider">/</span> {levelLabel(selected.level)}</div><h1>{selected.title}</h1><div className="article-meta"><span>출처: {selected.source_url ? <a href={selected.source_url} target="_blank" rel="noopener noreferrer">{selected.source} <ArrowUpRight size={12}/></a> : selected.source}</span><span>·</span><span>발행일 {selected.published_at}</span><span>·</span><span><Clock3 size={14}/> {selected.reading_minutes}분 읽기</span></div>{selected.id.startsWith('example-') && <p className="source-disclaimer">예시 학습 지문 · 위 원문을 참고해 수준에 맞게 새로 작성했어요. 원문 기사는 출처 링크에서 확인하세요.</p>}{selected.content_kind === 'rss_excerpt' && <p className="source-disclaimer">자동 수집된 짧은 피드 발췌문이에요. 전체 기사와 맥락은 출처 링크에서 확인하세요. 난이도는 자동 추정치이며, 학습 자료가 아직 없을 수 있어요.</p>}{selected.content_kind === 'ai_generated' && <p className="source-disclaimer">공개 피드를 바탕으로 AI가 작성한 학습 지문이에요. 오류가 있을 수 있으니 원문과 대조해 주세요.</p>}</div>
          <div className="reader-tabs">{([['article', '기사 읽기'], ['summary', '요약하기'], ['words', '단어 학습'], ['grammar', '문법 살펴보기'], ['translation', '한국어 번역']] as [Tab, string][]).map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setRevealed([]) }}>{label}</button>)}</div>
          <div className="reader-body">
            {tab === 'article' && <><div className="section-kicker">LET'S READ <span>01</span></div><h2>차근차근 읽어볼까요?</h2><p className="reader-help">모르는 단어가 나와도 괜찮아요. 전체 내용을 먼저 이해해 보세요.</p><div className="article-copy">{selected.content.split(/\n+/).filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div><div className="reader-next"><div><b>기사를 다 읽었나요?</b><span>이번에는 나만의 문장으로 정리해 보세요.</span></div><button className="primary-button" onClick={() => setTab('summary')}>요약하러 가기 <ArrowRight size={17}/></button></div></>}
            {tab === 'summary' && <><div className="section-kicker">THINK & WRITE <span>02</span></div><h2>나만의 문장으로 요약해요</h2><p className="reader-help">기사에서 가장 중요한 내용을 생각하며 자유롭게 적어 보세요.</p><label className="field-label" htmlFor="summary-note">내가 정리한 내용</label><textarea id="summary-note" className="note-area" maxLength={3000} placeholder="이 기사는 어떤 이야기인가요? 영어 또는 한국어로 핵심 내용을 적어 보세요." value={notes[selected.id] || ''} onChange={e => { setNotes({ ...notes, [selected.id]: e.target.value }); resetFeedback() }}/><p className="save-hint">요약은 이 브라우저에 자동 저장돼요. 5자 이상 작성해 주세요.</p><label className="feedback-consent"><input type="checkbox" checked={feedbackConsent} onChange={e => setFeedbackConsent(e.target.checked)}/><span>AI 피드백을 위해 요약과 기사 내용이 OpenAI에 전송되는 것에 동의해요. 이름 등 개인정보는 입력하지 마세요.</span></label><button className="primary-button summary-check" disabled={!feedbackConsent || (notes[selected.id] || '').trim().length < 5 || feedbackBusy} onClick={() => checkSummary(selected)}><Check size={17}/> {feedbackBusy ? '피드백을 분석하고 있어요...' : '요약 확인하기'}</button>{feedbackError && <p className="feedback-error" role="alert">{feedbackError}</p>}{summaryFeedback && <section className="summary-feedback" aria-live="polite" aria-label="요약 피드백"><div className="feedback-heading"><span><Sparkles size={19}/></span><div><h3>나의 요약 피드백</h3><p>AI 분석 결과는 틀릴 수 있어요. 기사 원문과 함께 확인하고 필요하면 선생님께 질문해 보세요.</p></div></div><p className="feedback-overall">{summaryFeedback.overall}</p><div className="feedback-list"><FeedbackSection number="01" title="어휘의 적절성" section={summaryFeedback.vocabulary}/><FeedbackSection number="02" title="문법과 문장" section={summaryFeedback.grammar}/><FeedbackSection number="03" title="의미와 핵심 내용" section={summaryFeedback.meaning}/></div>{summaryFeedback.revised_summary && <div className="feedback-revision"><h4>이렇게 다듬어 볼 수 있어요</h4><p>{summaryFeedback.revised_summary}</p></div>}</section>}<div className="summary-next"><button className="text-link" onClick={() => setTab('words')}>단어 학습하기 <ArrowRight size={16}/></button></div></>}
            {tab === 'words' && <><div className="section-kicker">WORD PRACTICE <span>03</span></div><h2>오늘의 단어를 익혀요</h2><p className="reader-help">카드를 눌러 뜻과 예문을 확인해 보세요.</p><div className="word-grid">{selected.words?.length ? selected.words.map((word, i) => <button className={`word-card ${revealed.includes(i) ? 'revealed' : ''}`} key={i} onClick={() => setRevealed(revealed.includes(i) ? revealed.filter(n => n !== i) : [...revealed, i])}><span>WORD {String(i + 1).padStart(2, '0')} <ArrowUpRight size={16}/></span><strong>{word.word}</strong>{revealed.includes(i) ? <><b>{word.meaning}</b><em>{word.example}</em></> : <small>눌러서 뜻 확인하기 +</small>}</button>) : <p className="empty-text">아직 등록된 단어가 없어요.</p>}</div><button className="primary-button" onClick={() => setTab('grammar')}>문법 살펴보기 <ArrowRight size={17}/></button></>}
            {tab === 'grammar' && <><div className="section-kicker">GRAMMAR NOTES <span>04</span></div><h2>문장 속 문법을 살펴봐요</h2><p className="reader-help">기사에서 만난 표현을 하나씩 알아볼까요?</p><div className="grammar-list">{selected.grammar?.length ? selected.grammar.map((item, i) => <div className="grammar-card" key={i}><span className="grammar-number">0{i + 1}</span><div><h3>{item.title}</h3><p>{item.explanation}</p><blockquote>{item.example}</blockquote></div></div>) : <p className="empty-text">아직 등록된 문법 설명이 없어요.</p>}</div><div className="grammar-actions"><button className="primary-button" onClick={() => markDone(selected.id)}><Check size={17}/> {completed.includes(selected.id) ? '학습 완료했어요!' : '오늘 학습 완료하기'}</button><button className="text-link" onClick={() => setTab('translation')}>한국어 번역 보기 <ArrowRight size={16}/></button></div></>}
            {tab === 'translation' && <><div className="section-kicker">KOREAN TRANSLATION <span>05</span></div><h2>한국어로 확인해요</h2><p className="reader-help">읽기와 학습을 마친 뒤 영어 지문의 내용을 확인해 보세요.{selected.content_kind === 'ai_generated' ? ' AI 번역은 틀릴 수 있으니 원문과 비교해 주세요.' : ''}</p>{translationParagraphs(selected.translation_ko).length ? <div className="translation-copy">{translationParagraphs(selected.translation_ko).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div> : <div className="empty-state">아직 이 지문의 한국어 번역이 등록되지 않았어요.</div>}<button className="text-link translation-back" onClick={() => setTab('article')}><ArrowLeft size={16}/> 영어 지문 다시 읽기</button></>}
          </div>
        </section> : <>
          <div className="welcome"><div><div className="eyebrow"><span className="status-dot"/> YOUR DAILY ENGLISH, MADE FUN</div><h1>{view === 'home' ? <>세상이 궁금한 너를 위한 <span>뉴스 한 스쿱!</span></> : view === 'saved' ? <>마음에 담아둔 <span>나의 스크랩</span></> : <>매일 만나는 <span>새로운 이야기</span></>}</h1><p>{view === 'saved' ? '저장해 둔 기사를 다시 만나보세요.' : '관심 있는 기사를 골라 세상을 읽고 영어 실력도 키워요.'}</p></div><div className="welcome-stamp"><span>GOOD TO<br/>GROW</span><Sparkles size={20}/></div></div>
          {!supabase && <div className="demo-notice"><Sparkles size={16}/><span><b>예시 학습 지문 5편</b> · 실제 보도를 참고해 새로 작성했어요. 매일 자동으로 업데이트되지는 않아요.</span></div>}
          {view === 'home' && featured && <div className="hero-card"><div className="hero-copy"><div className="hero-label"><span>✦</span> EDITOR'S PICK <span className="hero-label-line"/> 추천 이야기</div><h2>{featured.title}</h2><p>{featured.excerpt}</p><div className="hero-meta"><span>{featured.category}</span><span>·</span><span>{levelLabel(featured.level)}</span><span>·</span><span>{featured.reading_minutes} MIN READ</span></div><button onClick={() => openArticle(featured)}>기사 읽으러 가기 <ArrowUpRight size={17}/></button></div><div className="hero-image" style={{ backgroundImage: `url(${images[featured.cover_color] || images.sage})` }}><div className="hero-image-tag"><Leaf size={14}/> A LITTLE<br/>GOOD NEWS</div><div className="hero-image-caption">Small stories,<br/><i>big ideas.</i> <span>✳</span></div></div></div>}
          {view === 'home' && <div className="learning-strip"><div className="strip-intro"><span className="strip-icon"><Sparkles size={18}/></span><div><b>오늘의 학습 루틴</b><small>읽고, 생각하고, 내 것으로!</small></div></div><div className="strip-steps"><button onClick={() => featured && openArticle(featured, 'article')}><span>01</span> 기사 읽기 <ArrowRight size={15}/></button><button onClick={() => featured && openArticle(featured, 'summary')}><span>02</span> 요약하기 <ArrowRight size={15}/></button><button onClick={() => featured && openArticle(featured, 'words')}><span>03</span> 단어 & 문법 <ArrowRight size={15}/></button></div></div>}
          <div className="content-layout"><section className="article-section"><div className="section-heading"><div><div className="section-kicker">EXPLORE STORIES <span>✳</span></div><h2>{view === 'saved' ? '저장한 기사' : view === 'home' ? '최근 이야기 5편' : '이런 이야기는 어때요?'}</h2><p>{view === 'saved' ? '다시 읽고 싶은 이야기들을 모았어요.' : view === 'home' ? '최근 등록된 이야기 중 내 수준에 맞는 글을 골라요.' : '흥미로운 소식들로 세상을 더 넓게 만나봐요.'}</p></div>{view === 'home' && <button className="text-link" onClick={() => navigate('articles')}>전체 기사 보기 <ArrowRight size={16}/></button>}</div>
            <div className="level-filter"><span>난이도 선택</span><div>{levels.map(item => <button key={item.value} className={level === item.value ? 'active' : ''} aria-pressed={level === item.value} onClick={() => setLevel(item.value)}>{item.label}</button>)}</div></div><p className="level-hint">기초부터 도전까지, 나에게 맞는 난이도를 자유롭게 골라보세요.</p>
            <div className="filter-row"><div className="category-list">{categories.map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><label className="search-box"><Search size={16}/><input aria-label="기사 검색" placeholder="기사 검색" value={search} onChange={e => setSearch(e.target.value)}/></label></div>
            {loading ? <div className="empty-state">기사를 불러오는 중이에요...</div> : error ? <div className="empty-state">{error}</div> : filtered.length === 0 ? <div className="empty-state">{view === 'saved' && saved.length === 0 ? '아직 저장한 기사가 없어요.' : '조건에 맞는 기사가 없어요.'}</div> : <div className="article-grid">{filtered.map(article => <article className="article-card" key={article.id}><button className="card-image" onClick={() => openArticle(article)} style={{ backgroundImage: `url(${images[article.cover_color] || images.sage})` }} aria-label={`${article.title} 읽기`}><span className="card-category">{article.category}</span><span className="image-arrow"><ArrowUpRight size={17}/></span></button><div className="card-info"><div className="card-meta">{levelLabel(article.level)} <span>·</span> {article.reading_minutes} MIN READ</div><button className="card-title" onClick={() => openArticle(article)}>{article.title}</button><p>{article.excerpt}</p><div className="card-footer"><div className="card-source"><span>출처 {article.source}</span><span>{article.published_at}</span>{article.source_url && <a href={article.source_url} target="_blank" rel="noopener noreferrer">원문 보기 <ArrowUpRight size={11}/></a>}</div><button onClick={() => toggleSaved(article.id)} aria-label={saved.includes(article.id) ? '저장 취소' : '기사 저장'}><Bookmark size={17} fill={saved.includes(article.id) ? 'currentColor' : 'none'}/></button></div></div></article>)}</div>}
          </section><aside className="right-column"><div className="progress-card"><div className="progress-top"><span>MY LEARNING</span><span>✳</span></div><h3>오늘도 한 뼘 성장!</h3><p>작은 습관이 큰 실력이 돼요.</p><div className="progress-circle"><div><strong>{completed.length}</strong><span>완료한 기사</span></div></div><div className="progress-bottom"><span><CheckCircle2 size={17}/> 학습 완료</span><b>{completed.length}편</b></div></div><div className="quote-card"><div className="quote-mark">“</div><p>The more you read,<br/>the more you know.</p><span>읽을수록 더 넓어지는 세상</span><div className="quote-sparkle">✳</div></div><div className="tip-card"><span><Lightbulb size={17}/></span><p><b>이렇게 공부해 보세요!</b><br/>모르는 단어가 있어도 괜찮아요.<br/>먼저 기사 전체를 읽어 보세요.</p></div></aside></div>
          <footer><span>daily<span>.</span>scoop</span><p>Little stories for big thinkers. © Daily Scoop</p><span>MADE FOR CURIOUS MINDS ✳</span></footer>
        </>}
      </main>
    </div>
    {modal === 'login' && <LoginModal onClose={() => setModal(null)} onLogin={() => setModal('upload')} session={isTeacher ? session : null} onLogout={() => supabase?.auth.signOut()}/>}
    {modal === 'upload' && <UploadModal onClose={() => setModal(null)} onCreated={() => { setModal(null); loadArticles() }} onLogout={() => { supabase?.auth.signOut(); setModal(null) }}/ >}
  </div>
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
  return <ModalFrame title="새 기사 등록" subtitle="기사와 함께 학생들을 위한 학습 자료를 올려주세요." onClose={onClose}><form className="modal-form upload-form" onSubmit={submit}><div className="form-row"><label>영어 제목<input name="title" required /></label><label>한국어 제목 (검색용, 선택)<input name="title_ko" /></label></div><div className="form-row"><label>출처<input name="source" required placeholder="신문 또는 학교 이름"/></label><label>원문 링크<input name="source_url" type="url" placeholder="https:// (선택)"/></label></div><div className="form-row three"><label>카테고리<select name="category">{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label>추천 수준<select name="level" defaultValue="LEVEL 2">{levels.slice(1).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>읽기 시간 (분)<input name="reading_minutes" type="number" min="1" defaultValue="4" required/></label></div><div className="form-row"><label>발행일<input name="published_at" type="date" defaultValue={new Date().toLocaleDateString('en-CA')} required/></label><label>표지 스타일<select name="cover_color"><option value="sage">초록 정원</option><option value="blue">푸른 바다</option><option value="peach">따뜻한 하늘</option></select></label></div><label>영어 한 줄 소개<input name="excerpt"/></label><label>기사 본문<textarea name="content" required rows={7}/></label><label>한국어 본문 번역 <small>학습자가 번역 탭에서 확인할 수 있어요.</small><textarea name="translation_ko" rows={7} placeholder="영어 본문 전체를 한국어로 번역해 주세요."/></label><label>핵심 요약<textarea name="summary" rows={3}/></label><label>단어 학습 <small>한 줄에 하나씩: 단어 | 뜻 | 예문</small><textarea name="words" rows={3} placeholder="inspire | 영감을 주다 | The story inspired me."/></label><label>문법 학습 <small>한 줄에 하나씩: 문법 제목 | 설명 | 예문</small><textarea name="grammar" rows={3} placeholder="관계대명사 that | 앞의 명사를 꾸며줘요. | The book that I read."/></label><p className="save-hint">외부 기사는 이용 허락과 저작권을 확인한 후 등록해 주세요.</p>{message && <p className="form-error">{message}</p>}<div className="upload-actions"><button className="primary-button" disabled={busy}><Plus size={17}/>{busy ? '등록 중...' : '기사 등록하기'}</button><button type="button" className="logout-link" onClick={onLogout}>로그아웃</button></div></form></ModalFrame>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
