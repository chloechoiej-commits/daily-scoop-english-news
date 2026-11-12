const englishStopwords = new Set('a an the and or but if to of in on at for from with by as is are was were be been being this that these those it its they their them he she his her we our you your i my me can could will would should may might have has had do does did not also about into than then very more some other people'.split(' '))
const koreanStopwords = new Set('이 그 저 및 또는 그리고 하지만 그래서 대한 통해 경우 위해 대한 것 수 등 기사 내용 이야기 뉴스'.split(' '))

function englishTokens(text) {
  return (text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []).filter(word => word.length > 2 && !englishStopwords.has(word))
}

function englishRoot(word) {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3).replace(/(.)\1$/, '$1')
  if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2).replace(/(.)\1$/, '$1')
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

function koreanTokens(text) {
  return (text.match(/[가-힣]{2,}/g) || []).map(word => word.replace(/(에서는|으로|에서|에게|까지|부터|처럼|보다|으로|이고|하며|하고|하기|하는|했다|한다|하다|입니다|이다|이다|은|는|이|가|을|를|과|와|의|에|도|로)$/, '')).filter(word => word.length >= 2 && !koreanStopwords.has(word))
}

function exactWordUsed(text, word) {
  const escaped = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return escaped && new RegExp(`(?:^|[^a-z])${escaped}(?=$|[^a-z])`, 'i').test(text)
}

/** Rule-based hints, not an assessment of meaning or overall correctness. */
export function createSummaryFeedback(text, article) {
  const note = text.trim()
  if (!note) return null
  const english = (note.match(/[a-z]+/gi) || [])
  const koreanChars = (note.match(/[가-힣]/g) || []).length
  const isKorean = koreanChars > english.join('').length
  let vocabulary
  if (isKorean && english.length < 3) {
    vocabulary = '한국어로 요약했어요. 영어 문장으로도 써 보면 기사 속 표현을 연습할 수 있어요.'
  } else if (!english.length) {
    vocabulary = '단어를 확인할 수 없어요. 기사 내용을 문장으로 적어 보세요.'
  } else {
    const used = (article.words || []).map(item => item.word?.trim()).filter(word => word && exactWordUsed(note, word)).slice(0, 3)
    vocabulary = used.length
      ? `학습 단어 ${used.join(', ')}의 기본형을 사용했어요. 문맥에 맞는 뜻과 형태인지 다시 확인해 보세요.`
      : (article.words || []).length
        ? '등록된 학습 단어와 정확히 일치하는 표현은 찾지 못했어요. 뜻이 맞는 단어를 골라 활용해 보세요.'
        : '이 기사에 등록된 학습 단어가 없어 사용 여부는 확인할 수 없어요. 중요한 단어를 골라 활용해 보세요.'
  }

  let grammar
  if (isKorean && english.length < 3) {
    grammar = '한국어 문법은 자동으로 채점하지 않아요. 문장이 자연스럽게 이어지는지 소리 내어 읽어 보세요.'
  } else if (english.length < 3) {
    grammar = '영어 단어가 너무 적어 문장을 점검하기 어려워요. 주어와 동사를 넣어 한 문장 이상 써 보세요.'
  } else {
    const hints = []
    if (/\b(?:he|she|it)\s+(?:go|do|have)\b/i.test(note)) hints.push('he, she, it 뒤의 현재형 동사는 3인칭 단수 형태인지 확인하세요.')
    if (/\b(?:he|she|it)\s+are\b/i.test(note) || /\b(?:we|they|you)\s+is\b/i.test(note)) hints.push('주어에 맞게 be동사 is와 are를 골랐는지 확인하세요.')
    if (/\bi\b/.test(note)) hints.push('나를 뜻하는 영어 대명사 I는 항상 대문자로 써요.')
    if (!/[.!?。！？]\s*$/.test(note)) hints.push('마지막 문장 끝에 알맞은 문장 부호를 넣어 보세요.')
    grammar = hints.length ? hints.join(' ') : '정해진 점검 항목에서 수정할 표현을 찾지 못했어요. 시제와 주어·동사의 일치도 직접 확인해 보세요.'
  }

  const reference = isKorean ? `${article.title_ko || ''} ${article.summary || ''}`.trim() : `${article.title || ''} ${article.content || ''}`.trim()
  let keyPoints
  if (!reference) {
    keyPoints = isKorean ? '한국어 비교 자료가 없어 자동으로 비교할 수 없어요. 기사에서 누가, 무엇을, 왜 했는지 다시 확인해 보세요.' : '비교할 기사 내용이 없어요. 누가, 무엇을, 왜 했는지 다시 확인해 보세요.'
  } else {
    const noteTokens = isKorean ? koreanTokens(note) : englishTokens(note).map(englishRoot)
    const referenceTokens = isKorean ? koreanTokens(reference) : englishTokens(reference).map(englishRoot)
    const noteSet = new Set(noteTokens)
    const overlap = [...new Set(referenceTokens.filter(word => noteSet.has(word)))].slice(0, 4)
    keyPoints = overlap.length
      ? `기사의 비교 자료와 겹치는 표현: ${overlap.join(', ')}. 표현이 비슷해도 뜻이나 빠진 내용은 다를 수 있어요. 누가, 무엇을, 왜 했는지 원문과 비교해 보세요.`
      : '비교 자료와 똑같은 주요 표현을 찾지 못했어요. 다른 표현을 썼을 수도 있으니 누가, 무엇을, 왜 했는지 원문과 직접 비교해 보세요.'
  }
  return { vocabulary, grammar, keyPoints }
}
