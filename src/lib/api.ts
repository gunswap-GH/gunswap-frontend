// 调后端统计 API(server/),拿 indexer 预聚合好的 TVL / 24h量 / APR。
import { API_URL } from '../config'
import { cleanSym } from './sanitize'

export type ApiToken = { address: string; symbol: string; decimals: number }
export type ApiPool = {
  address: string
  token0: ApiToken
  token1: ApiToken
  reserve0: string
  reserve1: string
  feeBps: number
  tvlUsd: number
  vol24hUsd: number
  aprPct: number
}
export type ApiStats = { tvlUsd: number; vol24hUsd: number; pairs: number }

export async function fetchPools(): Promise<ApiPool[]> {
  const r = await fetch(`${API_URL}/pools`)
  if (!r.ok) throw new Error(`pools ${r.status}`)
  const pools: ApiPool[] = await r.json()
  // 净化 server 返回的链上原始 symbol(防钓鱼/同形字),与导入/pools.ts 链路一致
  for (const p of pools) {
    p.token0.symbol = cleanSym(p.token0.symbol)
    p.token1.symbol = cleanSym(p.token1.symbol)
  }
  return pools
}

export async function fetchStats(): Promise<ApiStats> {
  const r = await fetch(`${API_URL}/stats`)
  if (!r.ok) throw new Error(`stats ${r.status}`)
  return r.json()
}
