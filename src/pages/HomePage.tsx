import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import mascotHero from '../assets/mascot-hero.png'
import mascotSwap from '../assets/mascot-swap.png'
import mascotLiquidity from '../assets/mascot-liquidity.png'
import mascotFee from '../assets/mascot-fee.png'
import iconSwap from '../assets/icon-swap.svg'
import iconLiquidity from '../assets/icon-liquidity.svg'
import iconFee from '../assets/icon-fee.svg'
import iconArrow from '../assets/icon-arrow.svg'

// 欢迎/着陆页(按 Figma 设计稿;统计数字暂为静态占位)
export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // 标题里的 "GunSwap" 单独着色;各语言文案都包含该词,找不到时整句原样渲染
  const title = t('home.title')
  const [titlePre, titlePost] = title.split('GunSwap')

  const features = [
    {
      icon: iconSwap,
      mascot: mascotSwap,
      title: t('home.features.swapTitle'),
      desc: t('home.features.swapDesc'),
      link: t('home.features.swapLink'),
      to: '/swap'
    },
    {
      icon: iconLiquidity,
      mascot: mascotLiquidity,
      title: t('home.features.lpTitle'),
      desc: t('home.features.lpDesc'),
      link: t('home.features.lpLink'),
      to: '/liquidity'
    },
    {
      icon: iconFee,
      mascot: mascotFee,
      title: t('home.features.feeTitle'),
      desc: t('home.features.feeDesc'),
      link: t('home.features.feeLink'),
      to: '/docs'
    }
  ]

  // 新站无真实交易量,改成产品特性(无数字),避免假数据/空数据。第一格强调费率可调。
  const stats = [
    { value: t('home.feat.v1'), label: t('home.feat.l1') },
    { value: t('home.feat.v2'), label: t('home.feat.l2') },
    { value: t('home.feat.v3'), label: t('home.feat.l3') }
  ]

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <h1 className="hero-title">
            {titlePost === undefined ? (
              title
            ) : (
              <>
                {titlePre}
                <span className="hero-accent">GunSwap</span>
                {titlePost}
              </>
            )}
          </h1>
          <p className="hero-sub">{t('home.subtitle')}</p>

          <div className="hero-cta">
            <button className="hero-btn hero-btn-primary" onClick={() => navigate('/swap')}>
              {t('home.startSwap')}
            </button>
            <button className="hero-btn hero-btn-ghost" onClick={() => navigate('/liquidity')}>
              {t('home.viewPools')}
            </button>
          </div>

          <div className="hero-stats">
            {stats.map((s, i) => (
              <Fragment key={s.label}>
                {i > 0 && <i className="stat-div" />}
                <div>
                  <b>{s.value}</b>
                  <span>{s.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>

        <div className="hero-art" aria-hidden>
          <span className="hero-bubble b1" />
          <span className="hero-bubble b2" />
          <span className="hero-bubble b3" />
          <img className="hero-mascot" src={mascotHero} alt="" />
        </div>
      </section>

      <section className="home-features">
        {features.map((f) => (
          <div className="feature-card" key={f.to}>
            <span className="feature-icon">
              <img src={f.icon} alt="" />
            </span>
            <div className="feature-body">
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <button className="feature-link" onClick={() => navigate(f.to)}>
                {f.link}
                <img src={iconArrow} alt="" />
              </button>
            </div>
            <img className="feature-mascot" src={f.mascot} alt="" />
          </div>
        ))}
      </section>
    </div>
  )
}
