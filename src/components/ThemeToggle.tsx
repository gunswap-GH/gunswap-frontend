import { useTranslation } from 'react-i18next'
import { useTheme } from '../theme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === 'dark'
  const label = t(isDark ? 'theme.toLight' : 'theme.toDark')

  return (
    <button className="theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
