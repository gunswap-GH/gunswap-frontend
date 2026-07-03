import { useTranslation } from 'react-i18next'
import { Breadcrumb } from '../components/Breadcrumb'
import { CreatePoolCard } from '../components/CreatePoolCard'

export function CreatePoolPage() {
  const { t } = useTranslation()
  return (
    <div className="liq-page">
      <div className="liq-col">
        <Breadcrumb
          items={[
            { label: t('nav.farm'), to: '/liquidity' },
            { label: t('createPool.title') }
          ]}
        />
        <div className="liq-slot">
          <CreatePoolCard />
        </div>
      </div>
    </div>
  )
}
