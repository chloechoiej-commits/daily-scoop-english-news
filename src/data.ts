export type Word = { word: string; meaning: string; example: string }
export type Grammar = { title: string; explanation: string; example: string }
export type Article = {
  id: string; title: string; title_ko: string; category: string; source: string; source_url: string;
  published_at: string; reading_minutes: number; level: string; cover_color: string;
  excerpt: string; content: string; summary: string; words: Word[]; grammar: Grammar[];
  content_kind?: 'manual' | 'rss_excerpt' | 'ai_generated'
}

// Original practice texts based on the linked reporting, not the publishers' original articles.
export const demoArticles: Article[] = [
  {
    id: 'example-garden', title: 'A young helper in the garden', title_ko: '정원에서 이웃을 돕는 소년', category: '생활', source: 'TIME for Kids', source_url: 'https://www.timeforkids.com/g34/service-stars-star-power-jeremiah-vaughns/', published_at: '2026-03-13', reading_minutes: 3, level: 'LEVEL 1', cover_color: 'sage',
    excerpt: 'A community garden brings fresh food and neighbors together.',
    content: 'Jeremiah helps at a community garden in Nashville, Tennessee. He plants and picks vegetables there. He also helps other kids learn about gardening.\n\nThe garden grows food and flowers for people in the neighborhood. Some of the food is free. Jeremiah also enjoys helping clean up the community.\n\nHe thinks volunteering is a good way to meet people and help neighbors.',
    summary: '내슈빌의 제러마이어는 공동체 정원에서 채소를 기르고 아이들에게 정원 가꾸기를 알려주며 이웃을 돕습니다.',
    words: [{ word: 'community', meaning: '지역 사회, 공동체', example: 'The community has a garden.' }, { word: 'neighborhood', meaning: '동네, 이웃 지역', example: 'The garden helps the neighborhood.' }, { word: 'volunteer', meaning: '자원봉사하다', example: 'Many people volunteer at the garden.' }],
    grammar: [{ title: '일반동사의 3인칭 단수', explanation: '주어가 he, she처럼 한 사람일 때 현재형 동사에 보통 -s를 붙여요.', example: 'He plants and picks vegetables.' }]
  },
  {
    id: 'example-social', title: 'Australia changes social media rules for teens', title_ko: '호주, 청소년 소셜 미디어 규칙을 바꾸다', category: '세상', source: 'Student News Daily / UPI', source_url: 'https://www.studentnewsdaily.com/daily-news-article/australian-youth-lose-social-media-access-amid-national-ban/', published_at: '2025-12-10', reading_minutes: 4, level: 'LEVEL 3', cover_color: 'blue',
    excerpt: 'A new age restriction raises questions about safety and access.',
    content: 'In December 2025, Australia introduced restrictions on social media accounts for children under 16. The rules apply to several major platforms, and companies are responsible for meeting the requirements.\n\nThe government says the restrictions are intended to reduce young people’s exposure to online risks, including cyberbullying and harmful content. Supporters hope the change will make online spaces safer.\n\nOthers worry that the restrictions could limit young people’s access to information and make it harder to connect with friends. The debate shows how difficult it can be to balance safety with freedom online.',
    summary: '호주는 16세 미만의 소셜 미디어 계정 이용을 제한했습니다. 청소년 보호를 기대하는 의견과 정보 접근 및 소통 제한을 걱정하는 의견이 함께 나옵니다.',
    words: [{ word: 'restriction', meaning: '제한, 규제', example: 'The restriction applies to several platforms.' }, { word: 'exposure', meaning: '노출', example: 'The law aims to reduce exposure to harmful content.' }, { word: 'balance', meaning: '균형을 맞추다', example: 'It can be difficult to balance safety with freedom.' }],
    grammar: [{ title: '수동태: be + 과거분사', explanation: '행동을 받는 대상에 주목할 때 수동태를 사용해요.', example: 'The restrictions are intended to reduce online risks.' }, { title: '가주어 it', explanation: '긴 to부정사구를 문장 뒤로 보내고 it을 주어 자리에 쓸 수 있어요.', example: 'It can be difficult to balance safety with freedom.' }]
  },
  {
    id: 'example-science', title: 'Young scientists share big ideas', title_ko: '어린 과학자들이 나눈 큰 아이디어', category: '과학', source: 'NewsForKids.net', source_url: 'https://newsforkids.net/articles/2025/06/12/students-shine-at-international-science-fair/', published_at: '2025-06-12', reading_minutes: 4, level: 'LEVEL 2', cover_color: 'blue',
    excerpt: 'Students from around the world present their science projects.',
    content: 'In 2025, young scientists gathered in Columbus, Ohio, for an international science fair. About 1,700 students took part and shared projects on many different subjects.\n\nOne student designed a machine that can recycle plastic waste from 3D printing. Another student developed a test that changes color when it detects toxic dust.\n\nThe fair gave students a chance to show how creative ideas can help solve real-world problems.',
    summary: '2025년 미국 오하이오에서 열린 국제 과학 대회에서 학생들이 플라스틱 재활용 장치와 유독 먼지 감지 실험 등 다양한 아이디어를 선보였습니다.',
    words: [{ word: 'gather', meaning: '모이다', example: 'Young scientists gathered in Ohio.' }, { word: 'recycle', meaning: '재활용하다', example: 'The machine can recycle plastic.' }, { word: 'detect', meaning: '감지하다', example: 'The test can detect toxic dust.' }],
    grammar: [{ title: '관계대명사 that', explanation: 'that 뒤의 문장이 앞에 나온 명사를 꾸며줘요.', example: 'A student designed a machine that can recycle plastic.' }]
  },
  {
    id: 'example-flowers', title: 'Small flowers, helpful visitors', title_ko: '작은 꽃밭을 찾는 반가운 손님들', category: '환경', source: 'TIME for Kids', source_url: 'https://www.timeforkids.com/g2/flower-power-g2/', published_at: '2025-05-01', reading_minutes: 3, level: 'LEVEL 1', cover_color: 'peach',
    excerpt: 'Even small patches of wildflowers can help insects.',
    content: 'Wildflowers are pretty, but they also help insects. Bees and butterflies visit the flowers to find food.\n\nResearchers studied small groups of wildflowers in cities. They found that many kinds of pollinators visited even small patches.\n\nA big field is not the only place that can help nature. A small space can be useful, too.',
    summary: '도시의 작은 야생화 꽃밭에도 벌과 나비 같은 꽃가루받이 동물이 찾아옵니다. 작은 공간도 자연을 돕는 데 유용합니다.',
    words: [{ word: 'wildflower', meaning: '야생화', example: 'Wildflowers help insects.' }, { word: 'pollinator', meaning: '꽃가루받이를 돕는 동물', example: 'Bees are pollinators.' }, { word: 'space', meaning: '공간', example: 'A small space can help nature.' }],
    grammar: [{ title: 'can + 동사원형', explanation: 'can 뒤에 동사원형을 쓰면 할 수 있다는 가능성이나 능력을 나타내요.', example: 'A small space can help nature.' }]
  },
  {
    id: 'example-oysters', title: 'Growing oysters to help the coast', title_ko: '바다를 위해 굴을 키우는 소녀', category: '환경', source: 'TIME for Kids', source_url: 'https://www.timeforkids.com/g34/service-stars-oyster-duty-g3/', published_at: '2025-03-06', reading_minutes: 4, level: 'LEVEL 2', cover_color: 'blue',
    excerpt: 'A teenager in Mississippi helps the environment by raising oysters.',
    content: 'Demi Johnson from Mississippi has an unusual way to help the environment: she raises oysters. She started the activity as a Girl Scouts project.\n\nOysters can filter seawater, and groups of oysters provide homes for other sea creatures. Demi checks the cages regularly and removes mud and other unwanted things.\n\nWhen the oysters are big enough, they can be placed on reefs. Demi hopes more people will learn how this work helps the coast.',
    summary: '미시시피의 데미는 바닷물을 정화하고 해양 생물의 서식지가 되는 굴을 키우며 해안 환경 보호에 참여합니다.',
    words: [{ word: 'oyster', meaning: '굴', example: 'Oysters live in the sea.' }, { word: 'filter', meaning: '여과하다, 걸러내다', example: 'Oysters filter seawater.' }, { word: 'reef', meaning: '암초, 산호초', example: 'Oysters can be placed on reefs.' }],
    grammar: [{ title: 'When으로 시작하는 부사절', explanation: 'when은 “~할 때”라는 뜻으로 시간에 관한 문장을 연결해요.', example: 'When the oysters are big enough, they can be placed on reefs.' }]
  }
]
