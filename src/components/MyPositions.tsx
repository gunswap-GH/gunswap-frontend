import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ZeroAddress, formatUnits } from 'ethers'
import { CHAIN } from '../config'
import { fmtFee, fmtUsd } from '../lib/num'
import { fetchAllPairs } from '../lib/pools'
import { balancesOf } from '../lib/multicall'
import type { PairInfo } from '../lib/pools'
import { useWallet } from '../wallet'
import { TokenIcon } from './TokenIcon'
import { LiquidityModal } from './LiquidityModal'

const configured = CHAIN.factory !== ZeroAddress
const isStable = (s: string) => /usd/i.test(s || '')
// 稳定币锚 $1 → 推每个 token 单价
function unitUsd(r0: number, s0: string, r1: number, s1: string): [number, number] {
  if (isStable(s0)) return [1, r1 > 0 ? r0 / r1 : 0]
  if (isStable(s1)) return [r0 > 0 ? r1 / r0 : 0, 1]
  return [0, 0]
}
// 数量显示:千分位 + 按量级限小数,避免一长串
function fmtAmt(v: bigint, decimals: number): string {
  const n = Number(formatUnits(v, decimals))
  if (n === 0) return '0'
  const frac = n >= 1000 ? 2 : n >= 1 ? 4 : 6
  return n.toLocaleString('en-US', { maximumFractionDigits: frac })
}

type Position = {
  pair: PairInfo
  balance: bigint
  sharePct: number
  amount0: bigint
  amount1: bigint
}

export function MyPositions() {
  const { t } = useTranslation()
  const { account, connect } = useWallet()
  const [positions, setPositions] = useState<Position[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [modal, setModal] = useState<{ pair: PairInfo; mode: 'add' | 'remove' } | null>(null)

  function load() {
    if (!configured || !account) {
      setPositions(null)
      return
    }
    ;(async () => {
      try {
        const pairs = await fetchAllPairs()
        // 所有池的 LP 余额一次 multicall 读回(不再逐池往返)
        const balances = await balancesOf(pairs.map((p) => p.address), account)
        const mapped = pairs.map((pair, i) => {
          const balance = balances[i]
          if (balance <= 0n || pair.totalSupply <= 0n) return null
          return {
            pair,
            balance,
            sharePct: Number((balance * 1000000n) / pair.totalSupply) / 10000,
            amount0: (pair.reserve0 * balance) / pair.totalSupply,
            amount1: (pair.reserve1 * balance) / pair.totalSupply
          } as Position
        })
        setPositions(mapped.filter(Boolean) as Position[])
      } catch {
        setPositions([])
      }
    })()
  }

  useEffect(() => {
    setPositions(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  if (!account) {
    return (
      <div className="pos-empty">
        <p>{t('positions.connectHint')}</p>
        <button className="btn btn-primary" onClick={connect}>
          {t('wallet.connect')}
        </button>
      </div>
    )
  }

  return (
    <div className="pos-scroll">
      <div className="pos-row pos-head">
        <span>
          {t('positions.header')}
          {positions ? ` (${positions.length})` : ''}
        </span>
        <span className="col-num">{t('positions.colFee')}</span>
        <span className="col-num">{t('positions.colMyLp')}</span>
        <span className="col-num">{t('positions.colShare')}</span>
        <span className="col-num">{t('positions.colWithdrawable')}</span>
      </div>

      {positions === null && <div className="table-hint">{t('positions.loading')}</div>}
      {positions !== null && positions.length === 0 && <div className="table-hint">{t('positions.empty')}</div>}

      {positions?.map((p) => {
        const expanded = open === p.pair.address
        const t0 = p.pair.token0, t1 = p.pair.token1
        const rr0 = Number(formatUnits(p.pair.reserve0, t0.decimals))
        const rr1 = Number(formatUnits(p.pair.reserve1, t1.decimals))
        const [u0, u1] = unitUsd(rr0, t0.symbol, rr1, t1.symbol)
        const usdA = Number(formatUnits(p.amount0, t0.decimals)) * u0
        const usdB = Number(formatUnits(p.amount1, t1.decimals)) * u1
        return (
          <div className="pos-item" key={p.pair.address}>
            <div className="pos-row" onClick={() => setOpen(expanded ? null : p.pair.address)}>
              <div className="pool-pair">
                <div className="pool-icons">
                  <TokenIcon symbol={t0.symbol} address={t0.address} />
                  <TokenIcon symbol={t1.symbol} address={t1.address} />
                </div>
                <span className="pool-name">{t0.symbol}/{t1.symbol}</span>
                <span className="pool-caret">{expanded ? '▾' : '▸'}</span>
              </div>
              <span className="col-num">{fmtFee(p.pair.feeBps)}</span>
              <span className="col-num">{fmtAmt(p.balance, 18)}</span>
              <span className="col-num">{p.sharePct < 0.01 ? '<0.01' : p.sharePct.toFixed(2)}%</span>
              <span className="col-num col-multi">
                <span>{fmtAmt(p.amount0, t0.decimals)} {t0.symbol}</span>
                <span>{fmtAmt(p.amount1, t1.decimals)} {t1.symbol}</span>
              </span>
            </div>

            {expanded && (
              <div className="pos-detail">
                <div className="pos-detail-grid">
                  <div className="pdi">
                    <div className="pdi-h">我的流动性</div>
                    <div className="pdi-big">{fmtUsd(usdA + usdB)}</div>
                    <div className="pdi-sub">已存入代币</div>
                    <div className="pdi-tok"><TokenIcon symbol={t0.symbol} address={t0.address} /><b>{fmtAmt(p.amount0, t0.decimals)} {t0.symbol}</b><i>~{fmtUsd(usdA)}</i></div>
                    <div className="pdi-tok"><TokenIcon symbol={t1.symbol} address={t1.address} /><b>{fmtAmt(p.amount1, t1.decimals)} {t1.symbol}</b><i>~{fmtUsd(usdB)}</i></div>
                  </div>
                  <div className="pdi">
                    <div className="pdi-h">占比</div>
                    <div className="pdi-big">{p.sharePct < 0.01 ? '<0.01' : p.sharePct.toFixed(2)}%</div>
                    <div className="pdi-note">V2 池 · 无价格区间,流动性均匀分布</div>
                  </div>
                  <div className="pos-detail-actions">
                    <button className="btn btn-primary" onClick={() => setModal({ pair: p.pair, mode: 'add' })}>＋ 添加</button>
                    <button className="btn btn-soft" onClick={() => setModal({ pair: p.pair, mode: 'remove' })}>－ 移除</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {modal && (
        <LiquidityModal
          pool={modal.pair}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onDone={() => { setPositions(null); load() }}
        />
      )}
    </div>
  )
}
