export type Word = { word: string; meaning: string; example: string }
export type Grammar = { title: string; explanation: string; example: string }
export type Article = {
  id: string; title: string; title_ko: string; category: string; source: string; source_url: string;
  published_at: string; reading_minutes: number; level: string; cover_color: string;
  excerpt: string; content: string; summary: string; translation_ko?: string; words: Word[]; grammar: Grammar[];
  content_kind?: 'manual' | 'rss_excerpt' | 'ai_generated'; collection_day?: string | null; created_at?: string
}

// Original practice texts based on the linked reporting, not the publishers' original articles.
export const demoArticles: Article[] = [
  {
    id: 'example-garden', title: 'A young helper in the garden', title_ko: '정원에서 이웃을 돕는 소년', category: '생활', source: 'TIME for Kids', source_url: 'https://www.timeforkids.com/g34/service-stars-star-power-jeremiah-vaughns/', published_at: '2026-03-13', reading_minutes: 3, level: 'LEVEL 1', cover_color: 'sage',
    excerpt: 'A community garden brings fresh food and neighbors together.',
    content: 'Jeremiah helps at a community garden in Nashville, Tennessee. He plants and picks vegetables there. He also helps other kids learn about gardening.\n\nThe garden grows food and flowers for people in the neighborhood. Some of the food is free. Jeremiah also enjoys helping clean up the community.\n\nHe thinks volunteering is a good way to meet people and help neighbors.',
    translation_ko: '제러마이어는 테네시주 내슈빌에 있는 공동체 정원에서 일을 돕습니다. 그는 그곳에서 채소를 심고 수확합니다. 다른 아이들이 정원 가꾸기를 배우는 것도 도와줍니다.\n\n이 정원에서는 동네 사람들을 위해 먹거리와 꽃을 기릅니다. 먹거리 중 일부는 무료입니다. 제러마이어는 동네를 깨끗하게 만드는 일도 즐겁게 돕습니다.\n\n그는 자원봉사가 사람들을 만나고 이웃을 돕는 좋은 방법이라고 생각합니다.',
    summary: '내슈빌의 제러마이어는 공동체 정원에서 채소를 기르고 아이들에게 정원 가꾸기를 알려주며 이웃을 돕습니다.',
    words: [{ word: 'community', meaning: '지역 사회, 공동체', example: 'The community has a garden.' }, { word: 'neighborhood', meaning: '동네, 이웃 지역', example: 'The garden helps the neighborhood.' }, { word: 'volunteer', meaning: '자원봉사하다', example: 'Many people volunteer at the garden.' }],
    grammar: [{ title: '일반동사의 3인칭 단수', explanation: '주어가 he, she처럼 한 사람일 때 현재형 동사에 보통 -s를 붙여요.', example: 'He plants and picks vegetables.' }]
  },
  {
    id: 'example-social', title: 'Australia changes social media rules for teens', title_ko: '호주, 청소년 소셜 미디어 규칙을 바꾸다', category: '세상', source: 'Student News Daily / UPI', source_url: 'https://www.studentnewsdaily.com/daily-news-article/australian-youth-lose-social-media-access-amid-national-ban/', published_at: '2025-12-10', reading_minutes: 4, level: 'LEVEL 3', cover_color: 'blue',
    excerpt: 'A new age restriction raises questions about safety and access.',
    content: 'In December 2025, Australia introduced restrictions on social media accounts for children under 16. The rules apply to several major platforms, and companies are responsible for meeting the requirements.\n\nThe government says the restrictions are intended to reduce young people’s exposure to online risks, including cyberbullying and harmful content. Supporters hope the change will make online spaces safer.\n\nOthers worry that the restrictions could limit young people’s access to information and make it harder to connect with friends. The debate shows how difficult it can be to balance safety with freedom online.',
    translation_ko: '2025년 12월, 호주는 16세 미만 어린이와 청소년의 소셜 미디어 계정에 관한 제한을 도입했습니다. 이 규칙은 여러 주요 플랫폼에 적용되며, 기업은 해당 요건을 지킬 책임이 있습니다.\n\n정부는 이 제한이 사이버 괴롭힘과 유해한 콘텐츠를 포함한 온라인 위험에 청소년이 노출되는 일을 줄이기 위한 것이라고 말합니다. 이를 지지하는 사람들은 변화가 온라인 공간을 더 안전하게 만들기를 기대합니다.\n\n반면 다른 사람들은 이 제한이 청소년의 정보 접근을 막고 친구들과 소통하기 어렵게 만들 수 있다고 걱정합니다. 이 논쟁은 온라인에서 안전과 자유의 균형을 맞추는 일이 얼마나 어려울 수 있는지를 보여줍니다.',
    summary: '호주는 16세 미만의 소셜 미디어 계정 이용을 제한했습니다. 청소년 보호를 기대하는 의견과 정보 접근 및 소통 제한을 걱정하는 의견이 함께 나옵니다.',
    words: [{ word: 'restriction', meaning: '제한, 규제', example: 'The restriction applies to several platforms.' }, { word: 'exposure', meaning: '노출', example: 'The law aims to reduce exposure to harmful content.' }, { word: 'balance', meaning: '균형을 맞추다', example: 'It can be difficult to balance safety with freedom.' }],
    grammar: [{ title: '수동태: be + 과거분사', explanation: '행동을 받는 대상에 주목할 때 수동태를 사용해요.', example: 'The restrictions are intended to reduce online risks.' }, { title: '가주어 it', explanation: '긴 to부정사구를 문장 뒤로 보내고 it을 주어 자리에 쓸 수 있어요.', example: 'It can be difficult to balance safety with freedom.' }]
  },
  {
    id: 'example-science', title: 'Young scientists share big ideas', title_ko: '어린 과학자들이 나눈 큰 아이디어', category: '과학', source: 'NewsForKids.net', source_url: 'https://newsforkids.net/articles/2025/06/12/students-shine-at-international-science-fair/', published_at: '2025-06-12', reading_minutes: 4, level: 'LEVEL 2', cover_color: 'blue',
    excerpt: 'Students from around the world present their science projects.',
    content: 'In 2025, young scientists gathered in Columbus, Ohio, for an international science fair. About 1,700 students took part and shared projects on many different subjects.\n\nOne student designed a machine that can recycle plastic waste from 3D printing. Another student developed a test that changes color when it detects toxic dust.\n\nThe fair gave students a chance to show how creative ideas can help solve real-world problems.',
    translation_ko: '2025년, 어린 과학자들이 국제 과학 대회를 위해 오하이오주 콜럼버스에 모였습니다. 약 1,700명의 학생이 참가해 다양한 주제의 프로젝트를 선보였습니다.\n\n한 학생은 3D 프린팅에서 나오는 플라스틱 폐기물을 재활용할 수 있는 기계를 설계했습니다. 또 다른 학생은 유독 먼지를 감지하면 색이 변하는 시험 장치를 개발했습니다.\n\n이 대회는 학생들에게 창의적인 생각이 현실의 문제를 해결하는 데 어떻게 도움이 될 수 있는지 보여줄 기회를 주었습니다.',
    summary: '2025년 미국 오하이오에서 열린 국제 과학 대회에서 학생들이 플라스틱 재활용 장치와 유독 먼지 감지 실험 등 다양한 아이디어를 선보였습니다.',
    words: [{ word: 'gather', meaning: '모이다', example: 'Young scientists gathered in Ohio.' }, { word: 'recycle', meaning: '재활용하다', example: 'The machine can recycle plastic.' }, { word: 'detect', meaning: '감지하다', example: 'The test can detect toxic dust.' }],
    grammar: [{ title: '관계대명사 that', explanation: 'that 뒤의 문장이 앞에 나온 명사를 꾸며줘요.', example: 'A student designed a machine that can recycle plastic.' }]
  },
  {
    id: 'example-flowers', title: 'Small flowers, helpful visitors', title_ko: '작은 꽃밭을 찾는 반가운 손님들', category: '환경', source: 'TIME for Kids', source_url: 'https://www.timeforkids.com/g2/flower-power-g2/', published_at: '2025-05-01', reading_minutes: 3, level: 'LEVEL 1', cover_color: 'peach',
    excerpt: 'Even small patches of wildflowers can help insects.',
    content: 'Wildflowers are pretty, but they also help insects. Bees and butterflies visit the flowers to find food.\n\nResearchers studied small groups of wildflowers in cities. They found that many kinds of pollinators visited even small patches.\n\nA big field is not the only place that can help nature. A small space can be useful, too.',
    translation_ko: '야생화는 예쁘기도 하지만 곤충에게 도움이 되기도 합니다. 벌과 나비는 먹이를 찾기 위해 꽃을 찾아옵니다.\n\n연구자들은 도시의 작은 야생화 무리를 연구했습니다. 그들은 작은 꽃밭에도 다양한 종류의 꽃가루받이 동물들이 찾아온다는 사실을 발견했습니다.\n\n큰 들판만이 자연을 도울 수 있는 곳은 아닙니다. 작은 공간도 도움이 될 수 있습니다.',
    summary: '도시의 작은 야생화 꽃밭에도 벌과 나비 같은 꽃가루받이 동물이 찾아옵니다. 작은 공간도 자연을 돕는 데 유용합니다.',
    words: [{ word: 'wildflower', meaning: '야생화', example: 'Wildflowers help insects.' }, { word: 'pollinator', meaning: '꽃가루받이를 돕는 동물', example: 'Bees are pollinators.' }, { word: 'space', meaning: '공간', example: 'A small space can help nature.' }],
    grammar: [{ title: 'can + 동사원형', explanation: 'can 뒤에 동사원형을 쓰면 할 수 있다는 가능성이나 능력을 나타내요.', example: 'A small space can help nature.' }]
  },
  {
    id: 'example-oysters', title: 'Growing oysters to help the coast', title_ko: '바다를 위해 굴을 키우는 소녀', category: '환경', source: 'TIME for Kids', source_url: 'https://www.timeforkids.com/g34/service-stars-oyster-duty-g3/', published_at: '2025-03-06', reading_minutes: 4, level: 'LEVEL 2', cover_color: 'blue',
    excerpt: 'A teenager in Mississippi helps the environment by raising oysters.',
    content: 'Demi Johnson from Mississippi has an unusual way to help the environment: she raises oysters. She started the activity as a Girl Scouts project.\n\nOysters can filter seawater, and groups of oysters provide homes for other sea creatures. Demi checks the cages regularly and removes mud and other unwanted things.\n\nWhen the oysters are big enough, they can be placed on reefs. Demi hopes more people will learn how this work helps the coast.',
    translation_ko: '미시시피 출신 데미 존슨에게는 환경을 돕는 특별한 방법이 있습니다. 바로 굴을 기르는 것입니다. 그는 걸스카우트 프로젝트로 이 활동을 시작했습니다.\n\n굴은 바닷물을 걸러 낼 수 있고, 굴 무리는 다른 바다 생물에게 보금자리를 제공합니다. 데미는 정기적으로 굴을 기르는 우리를 확인하고 진흙과 다른 불필요한 것들을 제거합니다.\n\n굴이 충분히 자라면 굴 암초에 놓을 수 있습니다. 데미는 더 많은 사람이 이 일이 해안을 보호하는 데 어떻게 도움이 되는지 알게 되기를 바랍니다.',
    summary: '미시시피의 데미는 바닷물을 정화하고 해양 생물의 서식지가 되는 굴을 키우며 해안 환경 보호에 참여합니다.',
    words: [{ word: 'oyster', meaning: '굴', example: 'Oysters live in the sea.' }, { word: 'filter', meaning: '여과하다, 걸러내다', example: 'Oysters filter seawater.' }, { word: 'reef', meaning: '암초, 산호초', example: 'Oysters can be placed on reefs.' }],
    grammar: [{ title: 'When으로 시작하는 부사절', explanation: 'when은 “~할 때”라는 뜻으로 시간에 관한 문장을 연결해요.', example: 'When the oysters are big enough, they can be placed on reefs.' }]
  }
]
