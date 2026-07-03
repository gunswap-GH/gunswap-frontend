import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWallet } from '../wallet'
import { shortAddr } from '../lib/eth'
import { CHAIN } from '../config'
import { useHideOnScroll } from '../lib/useHideOnScroll'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link')

export function Header() {
  const { t } = useTranslation()
  const { account, connect, connecting, wrongNetwork, switchNetwork, openAccount } = useWallet()
  const hidden = useHideOnScroll()

  return (
    <header className={hidden ? 'header header--hidden' : 'header'}>
      <div className="header-left">
        <NavLink to="/" className="brand">
          <img className="brand-logo" src="/images/logo.svg" alt="GunSwap" />
          <span className="brand-name">
            Gun<span className="brand-accent">Swap</span>
          </span>
        </NavLink>

        <nav className="nav">
          <NavLink to="/swap" className={navClass}>
            {t('nav.swap')}
          </NavLink>
          <NavLink to="/liquidity" className={navClass}>
            {t('nav.liquidity')}
          </NavLink>
          <NavLink to="/docs" className={navClass}>
            {t('nav.docs')}
          </NavLink>
        </nav>
      </div>

      <div className="header-right">
        <div className="header-controls">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <div className="header-wallet">
          {account && wrongNetwork && (
            <button className="btn btn-warn" onClick={switchNetwork}>
              {t('wallet.switchTo', { network: CHAIN.name })}
            </button>
          )}

          {account ? (
            <button className="account-pill" onClick={openAccount}>
              <span className="dot" />
              {shortAddr(account)}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={connect} disabled={connecting}>
              {connecting ? t('wallet.connecting') : t('wallet.connect')}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
