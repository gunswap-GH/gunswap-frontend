import { useTranslation } from 'react-i18next'

// 社交链接 —— 真实地址拿到后替换 href。
const SOCIALS = [
  {
    key: 'x',
    label: 'X',
    href: 'https://x.com/gunswap_',
    icon: (
      <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.9l-5.4-7.06L4.5 22H1.24l8.02-9.17L1 2h7.08l4.88 6.46L18.244 2Zm-1.21 18h1.9L7.05 4H5.02l12.014 16Z" />
    )
  },
  {
    key: 'tg',
    label: 'Telegram',
    href: '#',
    icon: (
      <path d="M21.94 4.3 18.9 19.1c-.23 1.02-.84 1.27-1.7.79l-4.7-3.47-2.27 2.19c-.25.25-.46.46-.94.46l.34-4.78 8.7-7.86c.38-.34-.08-.53-.59-.19L6.97 13.2l-4.64-1.45c-1.01-.32-1.03-1.01.21-1.5l18.14-6.99c.84-.31 1.57.2 1.26 1.04Z" />
    )
  },
] as const

export function Footer() {
  const { t } = useTranslation()
  const year = 2026

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <img className="brand-logo sm" src="/images/logo.svg" alt="GunSwap" />
            <div>
              <div className="footer-name">GunSwap</div>
              <div className="footer-tagline">{t('footer.tagline')}</div>
            </div>
          </div>

          <div className="footer-socials">
            {SOCIALS.map((s) => (
              <a
                key={s.key}
                className="social-link"
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                title={s.label}
              >
                <span className="social-circle">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                    {s.icon}
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="footer-legal">
          <span>© {year} GunSwap · {t('footer.rights')}</span>
        </div>
      </div>
    </footer>
  )
}
