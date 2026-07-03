// ============================================================================
//  GunSwap configuration
//  After you deploy the contracts on BSC, fill in FACTORY and ROUTER below.
//  Switch ACTIVE between 'bscTestnet' and 'bscMainnet' as needed.
// ============================================================================

export type TokenInfo = {
  symbol: string
  name: string
  address: string // for the native coin use the special value 'NATIVE'
  decimals: number
  logo?: string
}

export type ChainConfig = {
  chainId: number
  chainIdHex: string
  name: string
  rpcUrls: string[]
  blockExplorer: string
  nativeCurrency: { name: string; symbol: string; decimals: number }
  // ---- contract addresses (fill these in after deployment) ----
  factory: string
  router: string
  wrappedNative: string // WBNB
  tokens: TokenInfo[]
}

const NATIVE = 'NATIVE'

// RPC 节点列表从 .env 读(逗号分隔),不再硬编码;留空时回退到单个官方节点保证可用。
// 注意:Vite 会在 build 时把 env 内联进产物,这些公共 RPC 仍会出现在 bundle 里(非保密,只是集中配置)。
const rpcsFromEnv = (raw: string | undefined, fallback: string): string[] => {
  const list = (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  return list.length ? list : [fallback]
}

export const CHAINS: Record<string, ChainConfig> = {
  bscTestnet: {
    chainId: 97,
    chainIdHex: '0x61',
    name: 'BSC Testnet',
    // 节点列表见 .env 的 VITE_BSC_TESTNET_RPCS(逗号分隔);FallbackProvider 用最快的健康节点。
    rpcUrls: rpcsFromEnv(import.meta.env.VITE_BSC_TESTNET_RPCS, 'https://bsc-testnet-rpc.publicnode.com'),
    blockExplorer: 'https://testnet.bscscan.com',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    // TODO: paste your deployed addresses here
    factory: '0x0000000000000000000000000000000000000000',
    router: '0x0000000000000000000000000000000000000000',
    wrappedNative: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // WBNB (testnet)
    tokens: [
      { symbol: 'tBNB', name: 'BNB', address: NATIVE, decimals: 18 },
      { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', decimals: 18 },
      // add your own test tokens (e.g. a test USDT you deployed) here:
      // { symbol: 'USDT', name: 'Test USDT', address: '0x...', decimals: 18 },
    ]
  },
  bscMainnet: {
    chainId: 56,
    chainIdHex: '0x38',
    name: 'BSC Mainnet',
    // 节点列表见 .env 的 VITE_BSC_RPCS(逗号分隔);FallbackProvider 用最快的健康节点。
    rpcUrls: rpcsFromEnv(import.meta.env.VITE_BSC_RPCS, 'https://bsc-dataseed.binance.org'),
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    // 已部署(BSC 主网【正式版】,2026-06-27,多管理员版,init hash 0x4e26…):
    factory: '0x4cd9d07f4D3618BEA846ACbc8A35334d4Cd33Ec7',
    router: '0xDb04A2A8643EC60E6149cB25b828329f20e5aCa2',
    wrappedNative: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB (mainnet)
    tokens: [
      { symbol: 'BNB', name: 'BNB', address: NATIVE, decimals: 18 },
      { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18 },
      // ── BSC 主网常用真实代币(官方 Binance-Peg 地址,均已链上核对 symbol/decimals,18 位)──
      { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
      { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
      { symbol: 'BUSD', name: 'BUSD Token', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
      { symbol: 'ETH', name: 'Ethereum Token', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18 },
      { symbol: 'BTCB', name: 'BTCB Token', address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', decimals: 18 },
    ]
  }
}

// which network the UI uses right now (mainnet — gas on BSC is cheap)
export const ACTIVE: keyof typeof CHAINS = 'bscMainnet'
export const CHAIN: ChainConfig = CHAINS[ACTIVE]

export const NATIVE_ADDRESS = NATIVE
export const isNative = (addr: string) => addr === NATIVE

// default UI settings
export const DEFAULT_SLIPPAGE = 0.5 // percent
export const DEFAULT_DEADLINE_MINUTES = 20

// 文档(GitBook):导航栏「文档」直接外链跳转到这里(新标签页打开)。
export const DOCS_GITBOOK_URL = 'https://gunswap.gitbook.io/gunswap-docs'

// 后端统计 API(TVL / 24h量 / APR 由 server 索引器预聚合好,前端纯读)。
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.gunswap.fun'
