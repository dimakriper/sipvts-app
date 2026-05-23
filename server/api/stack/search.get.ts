import { searchStack, SUPPORTED_LANGUAGES } from '../../services/stackSearch'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const language = (query.language as string | undefined)?.trim() ?? ''
  const keywordsRaw = (query.keywords as string | undefined) ?? ''

  if (!language) {
    throw createError({ statusCode: 400, statusMessage: 'Параметр "language" обязателен' })
  }

  if (!SUPPORTED_LANGUAGES.includes(language as typeof SUPPORTED_LANGUAGES[number])) {
    throw createError({
      statusCode: 400,
      statusMessage: `Язык "${language}" не поддерживается. Допустимые значения: ${SUPPORTED_LANGUAGES.join(', ')}`
    })
  }

  const keywords = keywordsRaw
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)

  return await searchStack(language, keywords)
})
