import { BrowserProvider, Contract, FallbackProvider, JsonRpcProvider, formatUnits, parseUnits } from 'ethers'
import type { AbstractProvider, Eip1193Provider } from 'ethers'
import { CHAIN } from '../config'

// ----------------------------------------------------------------------------
// 钱包 provider 桥接
// Reown AppKit 的 walletProvider 通过 React hook 拿到,这里用模块级单例保存,
// 让下面的 readContract/writeContract 仍能同步使用(wallet.tsx 负责写入)。
// ----------------------------------------------------------------------------
let walletEip1193: Eip1193Provider | null = null

export function setWalletProvider(p: Eip1193Provider | null) {
  walletEip1193 = p
}

export function hasWallet(): boolean {
  return walletEip1193 != null
}

// 专用只读 provider(单例)。staticNetwork:链已知,跳过自动网络探测,省掉每次往返。
// 配置了多个 RPC 时用 FallbackProvider:quorum=1 → 最快的健康节点先返回,某个挂了自动切下一个。
let readProvider: AbstractProvider | null = null
function getReadProvider(): AbstractProvider {
  if (readProvider) return readProvider
  const urls = CHAIN.rpcUrls
  const make = (url: string) => new JsonRpcProvider(url, CHAIN.chainId, { staticNetwork: true })
  if (urls.length <= 1) {
    readProvider = make(urls[0])
  } else {
    readProvider = new FallbackProvider(
      urls.map((url, i) => ({ provider: make(url), priority: i + 1, stallTimeout: 1500, weight: 1 })),
      CHAIN.chainId,
      { quorum: 1 }
    )
  }
  return readProvider
}

// 读取一律走专用 RPC:比经钱包(MetaMask)代理快很多,且不受钱包当前所在网络影响。
// ethers v6 会把同一 tick 内的多次调用自动合并成一个批量请求。
export function getProvider(): AbstractProvider {
  return getReadProvider()
}

export async function getSigner() {
  if (!walletEip1193) throw new Error('请先连接钱包')
  return new BrowserProvider(walletEip1193).getSigner()
}

// 只读合约(始终绑定到专用 RPC)
export function readContract(address: string, abi: any) {
  return new Contract(address, abi, getReadProvider())
}

// 写合约(绑定到 signer,需已连接钱包)
export async function writeContract(address: string, abi: any) {
  return new Contract(address, abi, await getSigner())
}

// 等待交易确认,但【带超时 + 链上效果轮询】。
// 多签(如 Safe)经 WalletConnect 发交易时,返回给 dApp 的 hash 往往是 safeTxHash(链下哈希),
// 并非最终上链执行的 tx 哈希;tx.wait() 会一直轮询一个查不到的哈希而永不返回,
// 导致按钮永久 loading(哪怕交易其实已上链成功)。
//
// 三条赛道,谁先到算谁:
//   1. tx.wait() 正常 resolve → 'confirmed'(普通钱包走这条);
//   2. opts.check() 轮询到链上效果已发生(如授权额度到位 / LP 余额变化)→ 'confirmed'
//      (多签即使 hash 对不上,只要真上链了也能秒判成功,不必干等超时);
//   3. 超时仍无确认 → 'pending'(让 UI 优雅恢复:提示"已提交,确认后刷新")。
// 交易真失败(revert/网络错)经 tx.wait() reject 照常抛出 → 上层红色报错。
export function confirmTx(
  tx: { wait: () => Promise<unknown> },
  opts: { check?: () => Promise<boolean>; timeoutMs?: number; pollMs?: number } = {}
): Promise<'confirmed' | 'pending'> {
  const timeoutMs = opts.timeoutMs ?? 90_000
  const pollMs = opts.pollMs ?? 3_500
  return new Promise((resolve, reject) => {
    let settled = false
    let poll: ReturnType<typeof setInterval> | undefined
    const timer = setTimeout(() => finish('pending'), timeoutMs)
    function cleanup() {
      clearTimeout(timer)
      if (poll) clearInterval(poll)
    }
    function finish(v: 'confirmed' | 'pending') {
      if (!settled) {
        settled = true
        cleanup()
        resolve(v)
      }
    }
    function fail(e: unknown) {
      if (!settled) {
        settled = true
        cleanup()
        reject(e)
      }
    }
    tx.wait().then(() => finish('confirmed'), (e) => fail(e))
    if (opts.check) {
      poll = setInterval(() => {
        opts
          .check!()
          .then((ok) => {
            if (ok) finish('confirmed')
          })
          .catch(() => {
            /* 轮询读取失败忽略,等下一次 */
          })
      }, pollMs)
    }
  })
}

// ---- formatting helpers ----

export function fmt(value: bigint, decimals: number, maxFrac = 6): string {
  const s = formatUnits(value, decimals)
  const [int, frac = ''] = s.split('.')
  if (!frac) return int
  const trimmed = frac.slice(0, maxFrac).replace(/0+$/, '')
  return trimmed ? `${int}.${trimmed}` : int
}

export function toUnits(value: string, decimals: number): bigint {
  if (!value || isNaN(Number(value))) return 0n
  try {
    return parseUnits(value as `${number}`, decimals)
  } catch {
    return 0n
  }
}

export function shortAddr(addr: string): string {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''
}
