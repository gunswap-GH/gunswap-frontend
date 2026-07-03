import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 当前语言(归一化:zh-CN-foo -> zh-CN,否则取列表里能匹配的)
  const current =
    LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ??
    LANGUAGES.find((l) => i18n.language?.startsWith(l.code)) ??
    LANGUAGES[0]

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const pick = (code: string) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className="lang" ref={ref}>
      <button className="lang-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span className="lang-globe" aria-hidden>🌐</span>
        <span className="lang-current">{current.name}</span>
        <span className="lang-caret" aria-hidden>▾</span>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                className={l.code === current.code ? 'lang-item active' : 'lang-item'}
                role="option"
                aria-selected={l.code === current.code}
                onClick={() => pick(l.code)}
              >
                {l.name}
                {l.code === current.code && <span className="lang-check">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
