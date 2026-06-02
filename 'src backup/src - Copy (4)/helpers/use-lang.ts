// helpers/use-lang.ts
import { en } from '~/locales/en'
import { km } from '~/locales/km'
import { useApplicationState } from '~/stores/application-state'

export type TranslationKey = keyof typeof en

export const useLang = () => {
  const lang = useApplicationState(s => s.settings.language)
  const dict = lang === 'km' ? km : en

  return (key: TranslationKey) => dict[key] || en[key]
}
