import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import iconSwap from '../assets/icon-swap.svg'
import iconLiquidity from '../assets/icon-liquidity.svg'
import iconFee from '../assets/icon-fee.svg'

// 移动端底部固定导航(桌面端用 CSS 隐藏)。
// 图标复用全站品牌图标(首页特性卡片同款),与网站视觉语言统一。
const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'bn-item active' : 'bn-item')

export function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="bottom-nav">
      <NavLink to="/swap" className={cls}>
        <img className="bn-icon" src={iconSwap} alt="" aria-hidden />
        <span className="bn-label">{t('nav.swap')}</span>
      </NavLink>
      <NavLink to="/liquidity" className={cls}>
        <img className="bn-icon" src={iconLiquidity} alt="" aria-hidden />
        <span className="bn-label">{t('nav.liquidity')}</span>
      </NavLink>
      <NavLink to="/docs" className={cls}>
        <img className="bn-icon" src={iconFee} alt="" aria-hidden />
        <span className="bn-label">{t('nav.docs')}</span>
      </NavLink>
    </nav>
  )
}
