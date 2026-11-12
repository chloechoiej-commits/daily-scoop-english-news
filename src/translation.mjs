export function translationParagraphs(translation) {
  if (typeof translation !== 'string' || !translation.trim()) return []
  return translation.split(/\n+/).map(paragraph => paragraph.trim()).filter(Boolean)
}
