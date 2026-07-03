// ============================================================================
//  react-i18next 初始化
//  支持 5 种语言:简体 / 繁体 / 英 / 日 / 韩。
//  作为副作用模块:在 main.tsx 顶部 import 一次即可。
// ============================================================================
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import en from './locales/en.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'

// 语言下拉用的元信息:code 对应 i18n,name 是各语言的本地名称。
export const LANGUAGES = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' }
] as const

export const SUPPORTED_LNGS = LANGUAGES.map((l) => l.code)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
      en: { translation: en },
      ja: { translation: ja },
      ko: { translation: ko }
    },
    fallbackLng: 'zh-CN',
    supportedLngs: SUPPORTED_LNGS as unknown as string[],
    // 注意:不要开 nonExplicitSupportedLngs —— 我们的资源键是显式区域码(zh-CN/zh-TW),
    // 开了它会让 zh-CN 去查不存在的 zh bundle,导致 t() 返回 key。
    initAsync: false, // 同步初始化:内联资源在 React 挂载前就绪,避免首屏渲染出 key
    interpolation: { escapeValue: false },
    react: {
      useSuspense: false // 不依赖 Suspense 边界;未就绪时也能正常重渲染
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'gunswap.lang'
    }
  })

export default i18n
