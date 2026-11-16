// Rule-based learning materials (no API key needed): key words and grammar points found in an article.
// Shared by the daily collector and the teacher upload page.
import { TERMS, extractTerms } from './glossary.mjs'

// Technical terms get their own *notes, so they are left out of the key-word list.
const TERM_WORDS = new Set(TERMS.filter(t => !t.term.includes(' ')).map(t => t.term.toLowerCase()))

// Middle-school / news vocabulary with Korean meanings. Base forms; inflected forms are matched automatically.
const VOCAB_TEXT = `
ability=능력
absorb=흡수하다
access=접근, 이용
accident=사고
accomplish=성취하다
accurate=정확한
achieve=성취하다, 이루다
achievement=업적, 성취
active=활동적인
activity=활동
actually=실제로
adapt=적응하다
add=더하다, 덧붙이다
addition=추가
admire=존경하다, 감탄하다
adult=어른, 성인
advantage=이점, 장점
adventure=모험
advice=조언
affect=영향을 미치다
afford=(비용을) 감당하다
agency=기관, 단체
agree=동의하다
agriculture=농업
aim=목표로 하다
aircraft=항공기
alive=살아 있는
allow=허락하다
amazing=놀라운
ancestor=조상
ancient=고대의
announce=발표하다
annual=매년의
anxiety=불안
appear=나타나다
apply=지원하다, 적용하다
appreciate=감사하다, 진가를 알다
approach=접근하다; 방법
approve=승인하다
area=지역, 분야
argue=주장하다, 논쟁하다
arrive=도착하다
artificial=인공의
artist=예술가
astronaut=우주 비행사
athlete=운동선수
atmosphere=대기, 분위기
attach=붙이다
attack=공격하다
attempt=시도하다; 시도
attend=참석하다
attention=주의, 관심
attract=끌어들이다
audience=관객, 청중
author=작가
available=이용할 수 있는
average=평균의; 평균
avoid=피하다
award=상; 수여하다
aware=알고 있는
bacteria=세균, 박테리아
balance=균형
ban=금지하다; 금지
behavior=행동
belief=믿음
benefit=이익, 혜택
billion=10억
biodiversity=생물 다양성
biologist=생물학자
border=국경
borrow=빌리다
brain=뇌
brave=용감한
breathe=숨 쉬다
breeze=산들바람
budget=예산
burn=타다, 태우다
calculate=계산하다
campaign=캠페인, 운동
cancel=취소하다
capital=수도
capture=포착하다, 붙잡다
carbon=탄소
careful=조심하는
cause=일으키다; 원인
celebrate=축하하다
celebration=축하 행사
cell=세포
century=세기, 100년
ceremony=의식, 식
challenge=도전; 도전하다
champion=챔피언, 우승자
championship=선수권 대회
character=등장인물, 성격
charity=자선 단체
chemical=화학 물질; 화학의
citizen=시민
civil=시민의
claim=주장하다
climate=기후
coast=해안
collect=모으다, 수집하다
collection=수집품, 모음
colony=군집, 식민지
combine=결합하다
comfortable=편안한
comic=만화
common=흔한, 공통의
communicate=의사소통하다
community=지역 사회, 공동체
compare=비교하다
compete=경쟁하다
competition=대회, 경쟁
complete=완료하다; 완전한
complex=복잡한
concern=걱정, 관심사
condition=상태, 조건
conduct=수행하다
confident=자신감 있는
connect=연결하다
conservation=보존, 보호
consider=고려하다
contain=포함하다
contest=대회
continue=계속하다
contribute=기여하다
control=통제하다; 통제
coral=산호
create=창조하다, 만들다
creature=생물
crew=승무원, 팀
crisis=위기
crop=농작물
crowd=군중
cultural=문화의
culture=문화
curious=호기심 많은
current=현재의; 해류
damage=손상; 손상시키다
damp=축축한
danger=위험
dangerous=위험한
data=자료, 데이터
deadly=치명적인
debate=토론
decade=10년
decide=결정하다
decision=결정
decrease=감소하다
defend=방어하다
degree=도(온도 단위), 정도
delay=지연; 미루다
deliver=배달하다
demand=수요, 요구
depend=의존하다
describe=묘사하다
desert=사막
design=설계하다; 디자인
destroy=파괴하다
detail=세부 사항
detect=감지하다
develop=발달시키다, 개발하다
device=장치
diet=식단
difference=차이
difficult=어려운
dinosaur=공룡
direction=방향
disappear=사라지다
discover=발견하다
discovery=발견
disease=질병
distance=거리
diverse=다양한
donate=기부하다
donation=기부
drought=가뭄
earn=벌다, 얻다
earthquake=지진
ecosystem=생태계
education=교육
effect=효과, 영향
effort=노력
election=선거
electric=전기의
electricity=전기
emergency=비상사태
emotion=감정
encourage=격려하다
endangered=멸종 위기에 처한
energy=에너지
engineer=기술자, 엔지니어
enormous=거대한
ensure=보장하다
environment=환경
equal=동등한
equipment=장비
erosion=침식
erupt=분출하다
escape=탈출하다
especially=특히
establish=설립하다
event=행사, 사건
evidence=증거
exactly=정확히
examine=조사하다
exhibit=전시; 전시하다
exhibition=전시회
exist=존재하다
expand=확장하다
expect=기대하다, 예상하다
expedition=탐험
experience=경험
experiment=실험
expert=전문가
explain=설명하다
explore=탐험하다
explorer=탐험가
express=표현하다
extinct=멸종한
extraordinary=놀라운, 특별한
extreme=극심한
factory=공장
failure=실패
fair=공정한; 박람회
familiar=익숙한
famous=유명한
farmer=농부
feature=특징; 특별히 포함하다
federal=연방의
festival=축제
fiction=소설, 허구
figure=인물, 수치
flood=홍수
focus=집중하다; 초점
force=힘; 강요하다
forecast=예보
foreign=외국의
forest=숲
form=형성하다; 형태
formation=형성물, 대형
fossil=화석
founder=설립자
freezing=몹시 추운, 영하의
fuel=연료
fund=기금; 자금을 대다
gather=모이다, 모으다
generation=세대
generous=관대한, 후한
global=세계적인
goal=목표
government=정부
grateful=감사하는
gravity=중력
growth=성장
guide=안내서; 안내하다
habitat=서식지
harm=해; 해치다
harmful=해로운
harvest=수확; 수확하다
heal=치유하다
health=건강
healthy=건강한
heat=열; 데우다
heritage=유산
hero=영웅
historic=역사적인
history=역사
huge=거대한
human=인간
humid=습한
humidity=습도
hunt=사냥하다
identify=확인하다, 알아보다
illness=병
imagine=상상하다
immediately=즉시
impact=영향
importance=중요성
improve=향상시키다
include=포함하다
income=소득
increase=증가하다
independent=독립적인
individual=개인; 개인의
industry=산업
infection=감염
influence=영향; 영향을 주다
information=정보
ingredient=재료
injury=부상
insect=곤충
insight=통찰, 이해
inspire=영감을 주다
instead=대신에
instrument=악기, 도구
intelligence=지능
international=국제적인
invade=침입하다
invent=발명하다
invention=발명품
investigate=조사하다
involve=포함하다, 관련시키다
island=섬
issue=문제, 쟁점
journey=여행, 여정
judge=판사; 판단하다
justice=정의
knowledge=지식
landscape=풍경
language=언어
launch=발사하다, 시작하다
law=법
lawmaker=입법자, 국회의원
layer=층
leader=지도자
league=리그, 연맹
legend=전설
library=도서관
limit=제한; 제한하다
liquid=액체
literacy=읽고 쓰는 능력
local=지역의
locate=위치시키다, 찾아내다
machine=기계
major=주요한
manage=관리하다, 해내다
material=재료, 자료
measure=측정하다
medal=메달
medicine=약, 의학
memory=기억
mention=언급하다
message=메시지
method=방법
microbe=미생물
migrate=이동하다, 이주하다
million=100만
mineral=광물
mission=임무
modern=현대의
moisture=수분, 습기
monument=기념물
motion=움직임
mountain=산
movement=움직임, 운동
muscle=근육
museum=박물관
musician=음악가
mystery=수수께끼
national=국가의
native=토박이의, 원주민의
natural=자연의
nature=자연
necessary=필요한
neighbor=이웃
neighborhood=동네
nervous=긴장한
nutrient=영양소
observe=관찰하다
ocean=바다
offer=제공하다
official=공무원; 공식적인
operate=작동하다, 운영하다
opinion=의견
opportunity=기회
orbit=궤도
ordinary=평범한
organism=유기체, 생물
organization=단체, 조직
organize=정리하다, 조직하다
original=원래의, 독창적인
oxygen=산소
participate=참여하다
particular=특정한
passage=통로, 구절
patient=환자; 참을성 있는
pattern=패턴, 무늬
perform=공연하다, 수행하다
performance=공연, 성과
period=기간, 시대
permit=허가하다
persistence=끈기
physical=신체의, 물리적인
pillar=기둥
planet=행성
plastic=플라스틱
policy=정책
pollute=오염시키다
pollution=오염
popular=인기 있는
population=인구, 개체 수
positive=긍정적인
possible=가능한
poverty=가난
powerful=강력한
practice=연습하다; 연습
precipitation=강수(량)
predict=예측하다
prefer=선호하다
prepare=준비하다
present=발표하다; 현재의
president=대통령
pressure=압력
prevent=막다, 예방하다
previous=이전의
prize=상
probably=아마
process=과정
produce=생산하다
professional=전문적인; 프로의
professor=교수
program=프로그램
progress=진전
project=프로젝트, 과제
promote=증진하다, 홍보하다
protect=보호하다
protection=보호
protest=시위; 항의하다
proud=자랑스러운
provide=제공하다
public=대중의, 공공의
publish=출판하다
purpose=목적
quality=질, 품질
quantity=양
rare=드문
reach=도달하다
react=반응하다
recent=최근의
recognize=인정하다, 알아보다
record=기록; 기록하다
recover=회복하다
recycle=재활용하다
reduce=줄이다
region=지역
release=풀어 주다, 발표하다
rely=의지하다
remain=남아 있다
remove=제거하다
repair=수리하다
replace=대체하다
report=보고하다; 보고서
represent=대표하다, 나타내다
request=요청; 요청하다
require=필요로 하다
rescue=구조하다; 구조
research=연구
researcher=연구원
resident=주민
resource=자원
respect=존중하다
respond=응답하다
responsibility=책임
result=결과
reveal=드러내다
reward=보상
risk=위험
robot=로봇
role=역할
rule=규칙
safety=안전
satellite=위성
scan=훑어보다
schedule=일정
science=과학
scientist=과학자
sculpture=조각품
search=찾다; 검색
season=계절
secretary=장관, 비서
secure=안전한
sediment=침전물
select=선택하다
sense=감각; 느끼다
separate=분리된; 분리하다
series=시리즈, 연속
serious=심각한
shelter=피난처
shortage=부족
signal=신호
significant=중요한
similar=비슷한
single=하나의
site=장소, 현장
skill=기술, 능력
society=사회
soil=흙, 토양
solar=태양의
soldier=군인
solution=해결책
solve=해결하다
source=출처, 원천
spacecraft=우주선
species=종(생물)
spire=첨탑, 뾰족한 봉우리
spread=퍼지다, 퍼뜨리다
stadium=경기장
statement=성명, 진술
statue=조각상
storm=폭풍
strength=힘
stress=스트레스
structure=구조
struggle=애쓰다, 투쟁하다
succeed=성공하다
success=성공
suggest=제안하다
supply=공급하다; 공급
support=지지하다; 지원
surface=표면
surprise=놀라게 하다; 놀라움
survey=설문 조사
survive=살아남다
symbol=상징
system=체계, 시스템
talent=재능
technology=기술
telescope=망원경
temperature=온도
territory=영토
theory=이론
threat=위협
threaten=위협하다
tiny=아주 작은
title=제목, 칭호
tool=도구
tornado=토네이도
tough=힘든, 강인한
tournament=토너먼트, 대회
tower=탑; 우뚝 솟다
tradition=전통
traditional=전통적인
traffic=교통
transport=운송하다
travel=여행하다
treat=치료하다, 대하다
treatment=치료
trend=경향
tribe=부족
tropical=열대의
typically=일반적으로
unique=독특한
universe=우주
unusual=특이한
upgrade=승격시키다, 향상시키다
valuable=소중한, 가치 있는
variety=다양성
various=다양한
vehicle=차량
victory=승리
volcanic=화산의
volcano=화산
volunteer=자원봉사자; 자원봉사하다
vote=투표하다; 투표
warn=경고하다
waste=쓰레기; 낭비하다
wealth=부
weather=날씨
weigh=무게가 나가다
wildfire=산불
wildlife=야생 동물
wind=바람
witness=목격하다
wonder=궁금해하다
worldwide=전 세계적인
worry=걱정하다
`

export const VOCAB = Object.fromEntries(VOCAB_TEXT.trim().split('\n').map(line => line.split('=')).map(([w, m]) => [w.trim(), m.trim()]))

export function splitSentences(text) {
  // Per paragraph, so a subheading line never sticks to the next sentence.
  return String(text).split(/\n+/).flatMap(p => p.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["”’)]*/g) || []).map(s => s.trim()).filter(s => s.split(' ').length >= 4)
}

// Possible dictionary (base) forms of an inflected word.
export function baseForms(word) {
  const w = word.toLowerCase().replace(/[’']s$/, '')
  const out = [w]
  const add = (x) => { if (x.length > 2) out.push(x) }
  if (w.endsWith('ies')) add(w.slice(0, -3) + 'y')
  if (w.endsWith('es')) add(w.slice(0, -2))
  if (w.endsWith('s')) add(w.slice(0, -1))
  if (w.endsWith('ied')) add(w.slice(0, -3) + 'y')
  if (w.endsWith('ed')) { add(w.slice(0, -2)); add(w.slice(0, -1)); if (w.at(-3) === w.at(-4)) add(w.slice(0, -3)) }
  if (w.endsWith('ing')) { add(w.slice(0, -3)); add(w.slice(0, -3) + 'e'); if (w.at(-4) === w.at(-5)) add(w.slice(0, -4)) }
  return out
}

/** Regex matching a dictionary word and its common inflections (for highlighting in the article). */
export function wordPattern(base) {
  const b = base.toLowerCase().replace(/[^a-z-]/g, '')
  const stem = b.endsWith('e') ? b.slice(0, -1) : b
  const y = b.endsWith('y') ? `|${b.slice(0, -1)}(?:ies|ied)` : ''
  return new RegExp(`\\b(?:${b}(?:s|es|d|ed|ing)?|${stem}(?:ed|ing)${y}|${b}${b.at(-1)}(?:ed|ing))\\b`, 'i')
}

const shortSentence = (sentences, test) => sentences.filter(test).sort((a, b) => (a.length > 220) - (b.length > 220) || 0)[0]

/** Up to `limit` key words found in the text, with Korean meaning and the article sentence they appear in. */
export function extractWords(text, limit = 5, terms = extractTerms(text)) {
  // Words already explained as part of a technical term (e.g. "national" in "national park").
  const inTerms = new Set(terms.flatMap(t => t.term.toLowerCase().split(/[\s-]+/)))
  const sentences = splitSentences(text)
  const counts = new Map()
  for (const token of String(text).match(/[A-Za-z][A-Za-z’'-]+/g) || []) {
    if (/^[A-Z]/.test(token) && !/^[A-Z][a-z]/.test(token)) continue
    const base = baseForms(token).find(form => VOCAB[form] && !TERM_WORDS.has(form) && !inTerms.has(form))
    if (base) counts.set(base, (counts.get(base) || 0) + 1)
  }
  // Words that repeat are central to the story; among those, longer words are usually harder.
  const ranked = [...counts.entries()].sort((a, b) => Math.min(b[1], 2) - Math.min(a[1], 2) || b[0].length - a[0].length).map(([w]) => w)
  const words = []
  for (const word of ranked) {
    const pattern = wordPattern(word)
    const example = shortSentence(sentences, s => pattern.test(s))
    if (example) words.push({ word, meaning: VOCAB[word], example })
    if (words.length >= limit) break
  }
  return words
}

const IRREGULAR_PP = 'been|done|made|given|taken|seen|gone|grown|known|shown|written|become|found|won|built|begun|held|born|left|kept|brought|caught|taught|told|sold|sent|spent|thought|bought|run|come|put|set|cut|hit|read|lost|met|paid|said|heard|felt|fallen|eaten|driven|chosen|spoken|broken|frozen|hidden|stolen|worn|thrown|drawn|flown'
const PP = `(?:[a-z]+ed|${IRREGULAR_PP})`

// Grammar points in teaching order. `pattern` finds the structure; `focus` is the phrase to highlight.
const GRAMMAR_RULES = [
  { title: '현재완료 (have/has + 과거분사)', explanation: '과거에 시작된 일이 지금까지 이어지거나, 과거의 일이 현재와 관련 있을 때 써요. "~해 왔다, ~했다"로 해석해요.', pattern: new RegExp(`\\b(?:has|have)(?: not| never| already| just| finally| also)? ${PP}\\b`, 'i'), skip: /\b(?:has|have) been [a-z]+ing\b/i },
  { title: '수동태 (be동사 + 과거분사)', explanation: '주어가 동작을 "당하는" 입장일 때 써요. "~되다, ~받다"로 해석하고, 행위자는 by 뒤에 나와요.', pattern: new RegExp(`\\b(?:is|are|was|were|be|been|being)(?: [a-z]+ly)? ${PP}\\b`, 'i'), skip: /\b(?:is|are|was|were) (?:interested|excited|tired|bored|scared|worried|surprised)\b/i },
  { title: '관계대명사 who / which', explanation: '앞의 명사(선행사)를 뒤에서 꾸며 줘요. 사람이면 who, 사물·동물이면 which를 쓰고 "~하는 (명사)"로 해석해요.', pattern: /\b[a-z]+,? (?:who|which|whose) [a-z]+/i },
  { title: '조동사 can / might / should / must', explanation: '동사 앞에서 가능(can), 추측(might, may), 충고(should), 의무(must) 같은 뜻을 더해요. 조동사 뒤에는 항상 동사원형이 와요.', pattern: /\b(?:can|could|may|might|should|must)(?: not| also)? [a-z]+/i },
  { title: '비교급 (-er / more + than)', explanation: '두 대상을 비교할 때 "~보다 더 …한"이라는 뜻이에요. 짧은 형용사는 -er, 긴 형용사는 more를 붙이고 than 뒤에 비교 대상이 와요.', pattern: /\b(?:more|less) [a-z]+ than\b|\b[a-z]+er than\b/i, skip: /\b(?:other|rather|never|whether|either|neither|under|over|after) than\b/i },
  { title: '최상급 (the -est / the most)', explanation: '셋 이상 중에서 "가장 ~한"을 나타내요. the와 함께 -est 또는 most를 써요.', pattern: /\bthe (?:most [a-z]+|[a-z]{3,}est)\b/i, skip: /\bthe (?:interest|forest|rest|west|test|best-known|chest|request|contest|guest|harvest)\b/i },
  { title: 'to부정사 (동사 + to + 동사원형)', explanation: 'want, need, hope, plan, try 같은 동사 뒤에 to + 동사원형이 와서 "~하기를, ~하는 것을"이라는 뜻이 돼요.', pattern: /\b(?:want|wants|wanted|need|needs|needed|hope|hopes|hoped|plan|plans|planned|try|tries|tried|decide|decides|decided|learn|learns|learned|start|starts|started|begin|begins|began|like|likes|liked|love|loves|loved|help|helps|helped|continue|continues|continued) to [a-z]+/i },
  { title: '동명사 (동사 + -ing)', explanation: 'enjoy, keep, stop, finish 같은 동사 뒤에는 -ing 형태(동명사)가 와서 "~하는 것"이라는 뜻이 돼요.', pattern: /\b(?:enjoy|enjoys|enjoyed|keep|keeps|kept|stop|stops|stopped|finish|finishes|finished|avoid|avoids|avoided|practice|practices|practiced|imagine|imagines|imagined) [a-z]+ing\b/i },
  { title: 'There is / There are', explanation: '"~이 있다"라는 뜻이에요. 뒤에 오는 명사가 단수면 is, 복수면 are를 써요.', pattern: /\bthere(?:'s| is| are| was| were)\b/i },
  { title: '접속사 because / when / if', explanation: 'because는 이유(~ 때문에), when은 때(~할 때), if는 조건(만약 ~라면)을 나타내며 두 문장을 이어 줘요.', pattern: /\b(?:because|when|if) [a-z]+/i, skip: /\bwhen\?/ },
  { title: '과거시제', explanation: '이미 끝난 과거의 일을 말할 때 동사의 과거형을 써요. 규칙 동사는 -ed를 붙이고, 불규칙 동사는 형태가 바뀌어요.', pattern: /\b(?:he|she|they|it|we|i|[A-Z][a-z]+) (?:[a-z]+ed|was|were|had|went|made|took|gave|said|told|found|won|began|became|grew|saw|got)\b/ },
]

/** Up to `limit` grammar points that appear in the text, each with an example sentence from the article. */
export function extractGrammar(text, limit = 3) {
  const sentences = splitSentences(text)
  const out = []; const used = new Set()
  for (const rule of GRAMMAR_RULES) {
    const example = shortSentence(sentences, s => !used.has(s) && rule.pattern.test(s) && !(rule.skip && rule.skip.test(s)))
    if (!example) continue
    const focus = example.match(rule.pattern)?.[0] || ''
    used.add(example)
    out.push({ title: rule.title, explanation: rule.explanation, example, focus })
    if (out.length >= limit) break
  }
  return out
}

/** Fills empty word/grammar/term lists; keeps anything a teacher or AI already wrote. */
export function withLearning(article) {
  const text = article.content || ''
  const terms = article.terms?.length ? article.terms : extractTerms(text)
  return {
    ...article,
    words: article.words?.length ? article.words : extractWords(text, 5, terms),
    grammar: article.grammar?.length ? article.grammar : extractGrammar(text),
    terms,
  }
}
