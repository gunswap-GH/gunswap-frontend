import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PoolsTable } from '../components/PoolsTable'
import { MyPositions } from '../components/MyPositions'

type LpTab = 'pools' | 'positions'

export function LiquidityPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useState<LpTab>('pools')

  return (
    <div className="lp-page">
      <div className="lp-head">
        <div className="lp-tabs">
          <button className={tab === 'pools' ? 'lp-tab active' : 'lp-tab'} onClick={() => setTab('pools')}>
            {t('pools.allPools')}
          </button>
          <button className={tab === 'positions' ? 'lp-tab active' : 'lp-tab'} onClick={() => setTab('positions')}>
            {t('pools.myPositions')}
          </button>
        </div>
        <div className="lp-actions">
          <button className="lp-btn ghost" onClick={() => navigate('/liquidity/create')}>
            {t('pools.create')}
          </button>
          <button className="lp-btn solid" onClick={() => navigate('/liquidity/add')}>
            {t('pools.add')}
          </button>
        </div>
      </div>

      <div className="lp-panel">{tab === 'pools' ? <PoolsTable /> : <MyPositions />}</div>
    </div>
  )
}
