// Technical terms (전문 용어) that need background knowledge, with an easy Korean explanation.
// In the reader each term gets a *number on its first appearance and a note under the article.
// Format: term | Korean name | easy explanation. Multi-word terms are matched as phrases.
const GLOSSARY_TEXT = `
amoeba | 아메바 | 모양이 계속 바뀌는, 눈에 보이지 않을 만큼 작은 단세포 생물이에요.
bacteria | 세균(박테리아) | 아주 작은 단세포 생물이에요. 병을 일으키는 것도 있지만 우리 몸에 이로운 것도 많아요.
microbe | 미생물 | 현미경으로만 보이는 아주 작은 생물(세균, 곰팡이 등)을 통틀어 부르는 말이에요.
virus | 바이러스 | 세균보다 훨씬 작고, 다른 생물의 세포 안에서만 늘어나는 병원체예요.
single-celled | 단세포의 | 몸 전체가 세포 하나로 이루어진 생물을 말해요.
cell biologist | 세포생물학자 | 생물의 기본 단위인 세포가 어떻게 움직이고 일하는지 연구하는 과학자예요.
biologist | 생물학자 | 살아 있는 생물을 연구하는 과학자예요.
organism | 생물체 | 스스로 살아가는 하나하나의 생물(동물, 식물, 미생물)을 말해요.
species | 종 | 생물을 나누는 기본 단위예요. 같은 종끼리는 서로 짝을 지어 새끼를 낳을 수 있어요.
ecosystem | 생태계 | 한 지역의 생물과 물·흙·공기 같은 환경이 서로 영향을 주고받는 하나의 체계예요.
biodiversity | 생물 다양성 | 한 지역에 얼마나 많은 종류의 생물이 사는지를 뜻해요. 높을수록 자연이 건강해요.
habitat | 서식지 | 어떤 생물이 자연 속에서 먹고 자며 살아가는 곳이에요.
endangered | 멸종 위기의 | 수가 너무 줄어 곧 지구에서 사라질 위험이 있는 상태예요.
extinct | 멸종한 | 한 종의 생물이 지구에서 완전히 사라진 상태예요.
pollinator | 꽃가루 매개자 | 벌·나비처럼 꽃가루를 옮겨 식물이 열매를 맺게 돕는 동물이에요.
photosynthesis | 광합성 | 식물이 햇빛을 이용해 물과 이산화탄소로 양분과 산소를 만드는 과정이에요.
coral reef | 산호초 | 산호가 오랜 세월 쌓여 만든 바닷속 지형이에요. 많은 바다 생물의 집이에요.
coral bleaching | 산호 백화 현상 | 바닷물이 너무 따뜻해지면 산호가 함께 사는 조류를 잃고 하얗게 변해 약해지는 현상이에요.
bleached | 백화된 | 산호가 바닷물 온도 상승 등으로 색을 잃고 하얗게 변한 상태예요.
algae | 조류(해조류) | 물속에서 광합성을 하는 작은 생물이에요. 바다 생태계의 먹이가 돼요.
plankton | 플랑크톤 | 물에 떠다니는 아주 작은 생물이에요. 많은 바다 동물의 먹이가 돼요.
migration | 이동(철새 등의 이주) | 동물이 계절에 따라 먹이나 번식지를 찾아 먼 곳으로 옮겨 가는 것이에요.
hibernate | 겨울잠을 자다 | 일부 동물이 추운 겨울 동안 활동을 멈추고 잠자듯 지내는 것이에요.
fossil | 화석 | 아주 오래전 생물의 몸이나 흔적이 돌 속에 남은 것이에요.
sediment | 퇴적물 | 물이나 바람에 실려 와 바닥에 쌓인 모래·흙·진흙이에요.
erosion | 침식 | 바람·물·얼음이 오랜 시간 땅이나 바위를 조금씩 깎아 내는 현상이에요.
hoodoo | 후두(돌기둥 지형) | 침식으로 깎여 만들어진, 위가 버섯처럼 생긴 가늘고 높은 바위 기둥이에요.
spire | 첨탑 모양 바위 | 끝이 뾰족하게 솟은 바위 봉우리를 말해요.
volcanic ash | 화산재 | 화산이 폭발할 때 뿜어져 나오는 아주 고운 돌가루예요.
glacier | 빙하 | 오랜 세월 쌓인 눈이 다져져 생긴, 천천히 움직이는 거대한 얼음덩어리예요.
precipitation | 강수 | 비·눈·우박처럼 하늘에서 떨어지는 물을 모두 이르는 말이에요.
humidity | 습도 | 공기 중에 수증기가 얼마나 들어 있는지를 나타내는 정도예요.
Fahrenheit | 화씨(°F) | 미국에서 쓰는 온도 단위예요. 물은 32°F에서 얼고 212°F에서 끓어요. (0°C = 32°F)
Celsius | 섭씨(°C) | 우리나라에서 쓰는 온도 단위예요. 물은 0°C에서 얼고 100°C에서 끓어요.
climate change | 기후 변화 | 오랜 기간에 걸쳐 지구의 평균 기온과 날씨 패턴이 바뀌는 현상이에요.
global warming | 지구 온난화 | 온실가스 증가로 지구의 평균 기온이 점점 올라가는 현상이에요.
greenhouse gas | 온실가스 | 이산화탄소처럼 지구의 열을 가두어 기온을 높이는 기체예요.
carbon dioxide | 이산화탄소 | 숨을 내쉬거나 연료를 태울 때 나오는 기체예요. 대표적인 온실가스예요.
emissions | 배출가스 | 공장·자동차 등에서 공기 중으로 내보내는 기체예요.
fossil fuel | 화석 연료 | 석탄·석유·천연가스처럼 오래전 생물이 땅속에서 변해 만들어진 연료예요.
renewable energy | 재생 에너지 | 햇빛·바람·물처럼 써도 다시 채워지는 에너지예요.
solar panel | 태양광 패널 | 햇빛을 받아 전기로 바꾸는 판이에요.
drought | 가뭄 | 오랫동안 비가 내리지 않아 물이 부족한 상태예요.
hurricane | 허리케인 | 대서양 등에서 생기는 강한 열대 폭풍이에요. 태풍과 같은 종류예요.
tsunami | 쓰나미(지진 해일) | 바닷속 지진 등으로 생기는 아주 큰 파도예요.
satellite | 인공위성 | 지구 주위를 돌며 사진을 찍거나 통신을 돕는 기계예요.
orbit | 궤도 | 행성이나 위성이 다른 천체 주위를 도는 길이에요.
asteroid | 소행성 | 태양 주위를 도는 작은 바위 천체예요.
comet | 혜성 | 얼음과 먼지로 된 천체로, 태양에 가까워지면 긴 꼬리가 생겨요.
galaxy | 은하 | 수많은 별·가스·먼지가 모여 있는 거대한 집단이에요. 우리 은하는 '은하수'예요.
telescope | 망원경 | 멀리 있는 것을 크게 보여 주는 도구예요.
astronaut | 우주 비행사 | 우주선을 타고 우주에서 일하는 사람이에요.
NASA | 미국 항공우주국 | 미국 정부의 우주 탐사 기관이에요.
stargazing | 별 관찰 | 밤하늘의 별과 별자리를 바라보며 관찰하는 활동이에요.
constellation | 별자리 | 밤하늘의 별들을 이어 동물·사람 등의 모양으로 이름 붙인 것이에요.
gravity | 중력 | 물체를 서로 끌어당기는 힘이에요. 우리가 땅에 붙어 있는 이유예요.
DNA | DNA(유전 물질) | 생물의 생김새와 특징을 정하는 정보가 담긴 물질이에요.
gene | 유전자 | 부모에게서 자식에게 전해지는 특징 정보의 단위예요.
vaccine | 백신 | 병에 걸리기 전에 몸이 미리 싸울 힘을 기르도록 돕는 약이에요.
immune system | 면역 체계 | 세균·바이러스 같은 병원체로부터 몸을 지키는 기능이에요.
infection | 감염 | 세균이나 바이러스가 몸에 들어와 병을 일으키는 것이에요.
nostril | 콧구멍 | 코에 있는 두 개의 구멍이에요.
molecule | 분자 | 물질의 성질을 가진 가장 작은 알갱이예요. 원자 여러 개가 모여 만들어져요.
atom | 원자 | 모든 물질을 이루는 아주 작은 기본 알갱이예요.
artificial intelligence | 인공지능(AI) | 사람처럼 배우고 판단하도록 만든 컴퓨터 기술이에요.
algorithm | 알고리즘 | 컴퓨터가 문제를 풀기 위해 따르는 단계별 규칙이에요.
robotics | 로봇 공학 | 로봇을 설계하고 만들고 움직이게 하는 기술이에요.
prototype | 시제품 | 본격적으로 만들기 전에 시험해 보려고 처음 만든 모형이에요.
Proceedings of the National Academy of Sciences | 미국국립과학원회보(PNAS) | 과학자들이 새 연구 결과를 발표하는 유명한 과학 학술지예요.
journal | 학술지 | 연구 결과를 싣는 전문 잡지예요. 다른 과학자들의 검토를 거쳐 실려요.
Howard Hughes Medical Institute | 하워드 휴스 의학연구소 | 생명과학과 의학 연구를 지원하는 미국의 큰 연구 기관이에요.
mental health | 정신 건강 | 마음과 감정이 건강한 상태를 말해요.
national park | 국립공원 | 자연과 역사를 보호하기 위해 나라에서 지정해 관리하는 공원이에요.
national monument | 국가 기념물 | 역사적·자연적 가치가 있어 나라가 보호하도록 지정한 장소예요. 국립공원보다 지정이 간단해요.
Secretary of the Interior | 미국 내무부 장관 | 국립공원·자연 자원·원주민 관련 일을 맡는 미국 정부 부처의 장관이에요.
Native American | 아메리카 원주민 | 유럽인이 오기 전부터 아메리카 대륙에 살던 사람들과 그 후손이에요.
Apache | 아파치족 | 미국 남서부에 사는 아메리카 원주민 부족이에요.
heritage | 유산 | 조상에게서 물려받은 문화·전통·역사예요.
homeland | 고향 땅 | 한 민족이나 집단이 대대로 살아온 땅이에요.
Congress | 미국 의회 | 미국의 법을 만드는 기관이에요. 상원과 하원으로 나뉘어요.
Senate | 상원 | 미국 의회의 두 기관 중 하나로, 각 주에서 2명씩 뽑힌 의원으로 이루어져요.
House of Representatives | 하원 | 미국 의회의 두 기관 중 하나로, 인구에 비례해 뽑힌 의원으로 이루어져요.
Supreme Court | 대법원 | 나라에서 가장 높은 법원이에요. 최종 판결을 내려요.
governor | 주지사 | 미국에서 각 주를 이끄는 최고 책임자예요.
mayor | 시장 | 도시를 이끄는 최고 책임자예요.
impeach | 탄핵하다 | 대통령 같은 높은 공직자가 법을 어겼을 때 의회가 그 자리에서 물러나게 하는 절차를 밟는 것이에요.
impeachment | 탄핵 | 높은 공직자가 법을 어겼을 때 의회가 그 자리에서 물러나게 하는 절차예요.
election | 선거 | 투표로 대표자를 뽑는 일이에요.
ballot | 투표용지 | 투표할 때 선택을 표시하는 종이예요.
constitution | 헌법 | 나라를 운영하는 가장 기본이 되는 법이에요.
amendment | 개정안 | 법이나 헌법의 내용을 고치거나 덧붙인 것이에요.
federal | 연방의 | 미국처럼 여러 주가 모인 나라에서 중앙 정부와 관련된 것을 말해요.
legislation | 법률 | 의회에서 정해 만든 법이에요.
democracy | 민주주의 | 국민이 투표 등으로 나라의 일을 결정하는 정치 방식이에요.
parliament | 의회 | 영국 등 여러 나라에서 법을 만드는 기관이에요.
prime minister | 총리 | 영국·일본 등에서 정부를 이끄는 최고 책임자예요.
United Nations | 국제연합(UN) | 세계 평화와 협력을 위해 190여 개 나라가 모인 국제기구예요.
treaty | 조약 | 나라와 나라 사이에 맺는 공식적인 약속이에요.
sanction | 제재 | 규칙을 어긴 나라에 무역 제한 등 불이익을 주는 조치예요.
refugee | 난민 | 전쟁이나 박해를 피해 자기 나라를 떠난 사람이에요.
immigrant | 이민자 | 다른 나라로 옮겨 와서 사는 사람이에요.
tariff | 관세 | 다른 나라에서 들여오는 물건에 매기는 세금이에요.
economy | 경제 | 물건과 서비스를 만들고 사고파는 모든 활동이에요.
inflation | 물가 상승(인플레이션) | 물건값이 전반적으로 계속 오르는 현상이에요.
recession | 경기 침체 | 경제 활동이 줄어 일자리와 소득이 줄어드는 시기예요.
bank failure | 은행 파산 | 은행이 돈이 부족해 더 이상 영업을 하지 못하게 되는 것이에요.
stock market | 주식 시장 | 회사의 주식을 사고파는 시장이에요.
minimum wage | 최저 임금 | 법으로 정한, 일한 대가로 받아야 하는 가장 낮은 시급이에요.
nonprofit | 비영리 단체 | 돈을 벌기보다 사회를 돕는 것을 목적으로 하는 단체예요.
charity | 자선 단체 | 어려운 사람을 돕기 위해 기부를 모으는 단체예요.
literacy | 문해력 | 글을 읽고 쓰고 이해하는 능력이에요.
bilingual | 2개 국어의 | 두 가지 언어로 쓰였거나 두 언어를 할 줄 아는 것이에요.
Olympics | 올림픽 | 4년마다 전 세계 선수들이 모여 겨루는 국제 스포츠 대회예요.
Paralympics | 패럴림픽 | 장애가 있는 선수들이 참가하는 국제 스포츠 대회예요.
World Cup | 월드컵 | 4년마다 열리는 국가 대항 축구 대회예요.
Super Bowl | 슈퍼볼 | 미국 프로 미식축구(NFL)의 결승전이에요.
NBA | 미국프로농구(NBA) | 미국의 프로 농구 리그예요.
MLB | 미국 메이저리그 야구(MLB) | 미국의 프로 야구 리그예요.
NFL | 미국프로풋볼(NFL) | 미국의 프로 미식축구 리그예요.
World Series | 월드 시리즈 | 미국 프로 야구(MLB)의 우승팀을 가리는 결승전이에요.
Grammy | 그래미상 | 미국의 가장 유명한 음악 시상식이에요.
Oscar | 아카데미상(오스카) | 미국의 가장 유명한 영화 시상식이에요.
Nobel Prize | 노벨상 | 과학·문학·평화 등에서 인류에 크게 기여한 사람에게 주는 세계적인 상이에요.
Gloria Barron Prize for Young Heroes | 글로리아 배런 청소년 영웅상 | 사회와 환경을 위해 좋은 일을 한 미국과 캐나다의 청소년에게 주는 상이에요.
museum curator | 박물관 큐레이터 | 박물관의 전시를 기획하고 소장품을 관리하는 사람이에요.
curator | 큐레이터 | 박물관이나 미술관의 전시를 기획하고 작품을 관리하는 사람이에요.
graphic novel | 그래픽 노블 | 그림과 글로 긴 이야기를 들려주는 만화 형식의 책이에요.
ninja | 닌자 | 옛날 일본에서 몰래 정보를 모으거나 임무를 수행하던 사람이에요.
Thanksgiving | 추수감사절 | 미국과 캐나다에서 가을의 수확에 감사하는 명절이에요. 미국은 11월 넷째 목요일이에요.
`

export const TERMS = GLOSSARY_TEXT.trim().split('\n').map(line => {
  const [term, ko, note] = line.split('|').map(part => part.trim())
  return { term, ko, note }
}).sort((a, b) => b.term.length - a.term.length) // longest first so phrases win over single words

const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Regex for a term, allowing a plural/inflected last word (amoeba → amoebas, bleached, impeached). */
export function termPattern(term) {
  const parts = term.split(' ')
  const last = escape(parts.pop())
  const head = parts.map(escape).join('\\s+')
  const tail = /^[A-Z]{2,}$/.test(last) ? last : `${last}(?:s|es|ed|d)?`
  // Acronyms and proper nouns keep their case; ordinary terms match any case.
  return new RegExp(`\\b${head ? head + '\\s+' : ''}${tail}\\b`, /[A-Z]/.test(term) ? '' : 'i')
}

/** Technical terms that appear in the text, in order of first appearance. */
export function extractTerms(text, limit = 10) {
  const source = String(text)
  const found = []
  const taken = [] // character ranges already claimed by a longer term
  for (const entry of TERMS) {
    const match = termPattern(entry.term).exec(source)
    if (!match) continue
    const start = match.index, end = start + match[0].length
    if (taken.some(([s, e]) => start < e && end > s)) continue
    taken.push([start, end])
    found.push({ ...entry, at: start })
  }
  return found.sort((a, b) => a.at - b.at).slice(0, limit).map(({ term, ko, note }) => ({ term, ko, note }))
}
