import { useTranslation } from 'react-i18next'
import { Breadcrumb } from '../components/Breadcrumb'
import { LiquidityCard } from '../components/LiquidityCard'

export function AddLiquidityPage() {
  const { t } = useTranslation()
  return (
    <div className="liq-page">
      <div className="liq-col">
        <Breadcrumb
          items={[
            { label: t('nav.farm'), to: '/liquidity' },
            { label: t('pools.add') }
          ]}
        />
        <div className="liq-slot">
          <LiquidityCard />
        </div>
      </div>
    </div>
  )
}
