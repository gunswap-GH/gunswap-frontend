// 链上资金池读取:枚举 factory.allPairs,读储备/总量/每对手续费,
// 并解析两侧代币的符号/精度(配置内的直接用,未知的读链上)。
// "读一堆"的调用全走 Multicall3,整批一次往返(对慢/抖动的 RPC 更稳、更快)。
import { Interface } from 'ethers'
import { CHAIN, isNative } from '../config'
import { FACTORY_ABI, PAIR_ABI, ERC20_ABI } from '../abis'
import { readContract } from './eth'
import { multicall, type Call } from './multicall'
import { cleanSym } from './sanitize'

export type TokenMeta = { address: string; symbol: string; decimals: number }
export type PairInfo = {
  address: string
  token0: TokenMeta
  token1: TokenMeta
  reserve0: bigint
  reserve1: bigint
  totalSupply: bigint
  feeBps: number
}

const facIface = new Interface(FACTORY_ABI)
const pairIface = new Interface(PAIR_ABI)
const ercIface = new Interface(ERC20_ABI)

// 配置里已知代币的元数据缓存(地址小写 → 符号/精度);未知代币读到后也缓存。
const metaCache = new Map<string, { symbol: string; decimals: number }>()
for (const tk of CHAIN.tokens) {
  if (isNative(tk.address)) continue // 原生币没有合约地址,池子里见到的是 WBNB
  metaCache.set(tk.address.toLowerCase(), { symbol: tk.symbol, decimals: tk.decimals })
}

function metaOf(addr: string): TokenMeta {
  const m = metaCache.get(addr.toLowerCase())
  return m ? { address: addr, ...m } : { address: addr, symbol: addr.slice(0, 6), decimals: 18 }
}

// 拉取工厂里所有交易对(及其储备/手续费/代币元数据)。全程 3-4 次 multicall,与池子数量无关。
export async function fetchAllPairs(): Promise<PairInfo[]> {
  const len = Number(await readContract(CHAIN.factory, FACTORY_ABI).allPairsLength())
  if (!len) return []

  // 1) 一次拿到所有 pair 地址
  const addrs = (
    await multicall(
      Array.from({ length: len }, (_, i): Call => ({ target: CHAIN.factory, iface: facIface, fn: 'allPairs', args: [i] }))
    )
  ).filter((a): a is string => typeof a === 'string')

  // 2) 一次拿到每个 pair 的 token0/token1/reserves/totalSupply + 该对手续费
  const calls: Call[] = []
  for (const a of addrs) {
    calls.push({ target: a, iface: pairIface, fn: 'token0' })
    calls.push({ target: a, iface: pairIface, fn: 'token1' })
    calls.push({ target: a, iface: pairIface, fn: 'getReserves' })
    calls.push({ target: a, iface: pairIface, fn: 'totalSupply' })
    calls.push({ target: CHAIN.factory, iface: facIface, fn: 'swapFee', args: [a] })
  }
  const r = await multicall(calls)

  const raw = addrs
    .map((address, idx) => {
      const b = idx * 5
      return {
        address,
        t0: r[b] as string | undefined,
        t1: r[b + 1] as string | undefined,
        reserves: r[b + 2] as bigint[] | undefined,
        totalSupply: r[b + 3] as bigint | undefined,
        fee: r[b + 4] as bigint | undefined
      }
    })
    .filter((x) => x.t0 && x.t1 && x.reserves && x.totalSupply != null && x.fee != null)

  // 3) 收集未知代币,一次拿它们的 symbol/decimals
  const unknown = [...new Set(raw.flatMap((x) => [x.t0!, x.t1!]).filter((tk) => !metaCache.has(tk.toLowerCase())))]
  if (unknown.length) {
    const metaCalls: Call[] = []
    for (const tk of unknown) {
      metaCalls.push({ target: tk, iface: ercIface, fn: 'symbol' })
      metaCalls.push({ target: tk, iface: ercIface, fn: 'decimals' })
    }
    const mr = await multicall(metaCalls)
    unknown.forEach((tk, i) => {
      const symbol = mr[i * 2]
      const decimals = mr[i * 2 + 1]
      metaCache.set(tk.toLowerCase(), {
        symbol: symbol != null ? cleanSym(String(symbol)) : tk.slice(0, 6),
        decimals: decimals != null ? Number(decimals) : 18
      })
    })
  }

  return raw.map((x) => ({
    address: x.address,
    token0: metaOf(x.t0!),
    token1: metaOf(x.t1!),
    reserve0: x.reserves![0],
    reserve1: x.reserves![1],
    totalSupply: x.totalSupply!,
    feeBps: Number(x.fee!)
  }))
}
