// 批量只读:把多个 eth_call 合并成一次 Multicall3.aggregate3,一个 RPC 往返拿回全部结果。
// 用于持仓/余额这类"读一堆"的场景 —— 往返从几十次压到 1 次,对慢/抖动的 RPC 尤其稳。
import { Contract, Interface } from 'ethers'
import { getProvider } from './eth'
import { ERC20_ABI } from '../abis'

// Multicall3:几乎所有 EVM 链(含 BSC)都部署在同一地址。
export const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11'
const M3_ABI = [
  'function aggregate3((address target, bool allowFailure, bytes callData)[] calls) view returns ((bool success, bytes returnData)[] returnData)',
  'function getEthBalance(address addr) view returns (uint256 balance)'
]
const m3Iface = new Interface(M3_ABI)
const erc20Iface = new Interface(ERC20_ABI)

export type Call = { target: string; iface: Interface; fn: string; args?: any[] }

// 执行一批调用;返回与 calls 对齐的结果数组。单项失败(合约 revert 等)返回 undefined,不拖垮整批。
// 结果若只有一个返回值则直接返回该值,多个则返回数组(同 ethers decodeFunctionResult)。
export async function multicall(calls: Call[]): Promise<any[]> {
  if (calls.length === 0) return []
  const m3 = new Contract(MULTICALL3, M3_ABI, getProvider())
  const payload = calls.map((c) => ({
    target: c.target,
    allowFailure: true,
    callData: c.iface.encodeFunctionData(c.fn, c.args ?? [])
  }))
  const res: any[] = await m3.aggregate3.staticCall(payload)
  return res.map((r: any, i: number) => {
    const success: boolean = r.success ?? r[0]
    const data: string = r.returnData ?? r[1]
    if (!success || !data || data === '0x') return undefined
    try {
      const d = calls[i].iface.decodeFunctionResult(calls[i].fn, data)
      return d.length === 1 ? d[0] : d
    } catch {
      return undefined
    }
  })
}

// 一次往返读多个 ERC20 余额;返回与 tokens 对齐的 bigint[](读不到的为 0n)。
export async function balancesOf(tokens: string[], account: string): Promise<bigint[]> {
  const res = await multicall(tokens.map((t) => ({ target: t, iface: erc20Iface, fn: 'balanceOf', args: [account] })))
  return res.map((v) => (typeof v === 'bigint' ? v : 0n))
}

// 单个 ERC20 余额调用(给 TokenModal 把原生币/ERC20 拼进同一批用)。
export function erc20BalanceCall(token: string, account: string): Call {
  return { target: token, iface: erc20Iface, fn: 'balanceOf', args: [account] }
}

// 原生币(BNB)余额调用 —— 走 Multicall3.getEthBalance,可和 ERC20 余额拼进同一批。
export function ethBalanceCall(account: string): Call {
  return { target: MULTICALL3, iface: m3Iface, fn: 'getEthBalance', args: [account] }
}
