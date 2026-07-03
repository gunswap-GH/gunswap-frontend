import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { appKit } from './appkit'

type Theme = 'light' | 'dark'
const KEY = 'gunswap.theme'

function getInitial(): Theme {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem(KEY)
  if (saved === 'light' || saved === 'dark') return saved
  // 新用户默认浅色(不跟随系统的深色模式);手动切过的保留各自选择。
  return 'light'
}

// 模块加载即应用初始主题,避免首屏闪烁(在 React 挂载前就设好 html[data-theme])
if (typeof document !== 'undefined') {
  document.documentElement.dataset.theme = getInitial()
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitial)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(KEY, theme)
    // 让 Reown 钱包弹窗也跟随日/夜主题
    try {
      appKit?.setThemeMode?.(theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
