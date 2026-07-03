// ============================================================================
//  Reown AppKit (原 WalletConnect / Web3Modal) 初始化
//  使用 ethers 适配器 —— 保留全站 ethers v6 代码,无需迁到 wagmi。
//  作为副作用模块:在 main.tsx 顶部 import 一次即可。
// ============================================================================
import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { bsc, bscTestnet } from '@reown/appkit/networks'
import { ACTIVE } from './config'

// projectId 从 .env 读取(VITE_REOWN_PROJECT_ID)。
// 留空时用一个占位值,保证能编译运行;已安装的浏览器钱包仍可连接,
// 但 WalletConnect 扫码需要真实 projectId。
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'gunswap-dev-placeholder'

// 跟随 config.ts 的 ACTIVE 选择默认网络。
const defaultNetwork = ACTIVE === 'bscMainnet' ? bsc : bscTestnet

export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [bsc, bscTestnet],
  defaultNetwork,
  projectId,
  metadata: {
    name: 'GunSwap',
    description: 'GunSwap —— BSC 上的去中心化兑换',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://gunswap.app',
    icons: []
  },
  features: {
    analytics: false,
    email: false,
    socials: false
  }
})
