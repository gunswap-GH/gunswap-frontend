import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CHAIN } from '../config'
import type { TokenInfo } from '../config'
import { fmtFee, fmtUsd } from '../lib/num'
import { fetchPools, type ApiPool, type ApiToken } from '../lib/api'
import { readContract } from '../lib/eth'
import { FACTORY_ABI } from '../abis'
import { TokenIcon } from './TokenIcon'

const isStable = (s: string) => /usd/i.test(s || '')
const toTok = (t: ApiToken): TokenInfo => ({ symbol: t.symbol, name: t.symbol, address: t.address, decimals: t.decimals })

// 测试期:「所有池子」列表只显示【最新建的那一个池】(每出现一个新池,列表就只剩这一行)。
// 仅对测试工厂生效;切回正式版(工厂地址变 0x4cd9…)时自动恢复显示全部,无需手动改。
const TEST_FACTORY = '0xa124454596b8dd7752b28ce5ccfc5d2ecdfcc1cf'
const onlyNewest = CHAIN.factory.toLowerCase() === TEST_FACTORY

export function PoolsTable() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [pools, setPools] = useState<ApiPool[] | null>(null)
  const [newest, setNewest] = useState<string | null>(null)
  const [newestDone, setNewestDone] = useState(false) // 链上"最新池"读取是否已完成(成功或失败)

  useEffect(() => {
    let cancelled = false
    setPools(null)
    fetchPools()
      .then((p) => {
        if (!cancelled) setPools(p)
      })
      .catch(() => {
        if (!cancelled) setPools([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 测试期:读链上最新一个 pair 地址(factory.allPairs(length-1)),列表只显示它。
  useEffect(() => {
    if (!onlyNewest) {
      setNewestDone(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const factory = readContract(CHAIN.factory, FACTORY_ABI)
        const len = Number(await factory.allPairsLength())
        if (len > 0 && !cancelled) setNewest(String(await factory.allPairs(len - 1)).toLowerCase())
      } catch {
        /* 读不到就退回显示全部 */
      } finally {
        if (!cancelled) setNewestDone(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // 点整行 → 跳 swap 页并预填该池两个币:稳定币侧作"支付(in)"、另一侧作"买入(out)"
  function trade(p: ApiPool) {
    const t0 = toTok(p.token0)
    const t1 = toTok(p.token1)
    let swapIn = t0
    let swapOut = t1
    if (isStable(p.token1.symbol) && !isStable(p.token0.symbol)) {
      swapIn = t1
      swapOut = t0
    }
    navigate('/swap', { state: { swapIn, swapOut } })
  }

  // 加载中 = 池子还没拿到,或(测试期)最新池地址还没读到 —— 此时只显示"加载中",不闪烁全部。
  const loading = pools === null || (onlyNewest && !newestDone)
  // 读到最新地址就只留它;非测试期或读失败(newest 仍为空)则显示全部。
  const shown = !onlyNewest || newest == null ? pools ?? [] : (pools ?? []).filter((p) => p.address.toLowerCase() === newest)

  return (
    <div className="pools-scroll">
      <div className="pool-row pool-head">
        <span>{t('pools.col.pool')}</span>
        <span className="col-num">{t('pools.col.fee')}</span>
        <span className="col-num">{t('pools.col.tvl')}</span>
        <span className="col-num">{t('pools.col.vol')}</span>
      </div>

      {loading && <div className="table-hint">{t('pools.loading')}</div>}
      {!loading && shown.length === 0 && <div className="table-hint">{t('pools.empty')}</div>}

      {!loading &&
        shown.map((p) => (
          <div
            className="pool-row pool-item pool-clickable"
            key={p.address}
            role="button"
            tabIndex={0}
            title={t('pools.tradeHint')}
            onClick={() => trade(p)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                trade(p)
              }
            }}
          >
            <div className="pool-pair">
              <div className="pool-icons">
                <TokenIcon symbol={p.token0.symbol} address={p.token0.address} />
                <TokenIcon symbol={p.token1.symbol} address={p.token1.address} />
              </div>
              <span className="pool-name">
                {p.token0.symbol}/{p.token1.symbol}
                {onlyNewest && (
                  <span
                    style={{ display: 'block', fontSize: 11, fontWeight: 400, color: '#9aa6ab', wordBreak: 'break-all', marginTop: 2, cursor: 'copy' }}
                    title="点击复制 pair 合约地址"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard?.writeText(p.address)
                    }}
                  >
                    {p.address}
                  </span>
                )}
              </span>
            </div>
            <span className="col-num">{fmtFee(p.feeBps)}</span>
            <span className="col-num">{fmtUsd(p.tvlUsd)}</span>
            <span className="col-num">{p.vol24hUsd > 0 ? fmtUsd(p.vol24hUsd) : '—'}</span>
          </div>
        ))}
    </div>
  )
}
