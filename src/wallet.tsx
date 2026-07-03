import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider
} from '@reown/appkit/react'
import { bsc, bscTestnet } from '@reown/appkit/networks'
import { getAddress } from 'ethers'
import type { Eip1193Provider } from 'ethers'
import { ACTIVE, CHAIN } from './config'
import { setWalletProvider } from './lib/eth'

type WalletState = {
  account: string | null
  chainId: number | null
  connecting: boolean
  wrongNetwork: boolean
  connect: () => void
  switchNetwork: () => void
  openAccount: () => void
}

const WalletContext = createContext<WalletState | null>(null)

const targetNetwork = ACTIVE === 'bscMainnet' ? bsc : bscTestnet

function normalize(addr?: string | null): string | null {
  if (!addr) return null
  try {
    return getAddress(addr)
  } catch {
    return addr
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { open } = useAppKit()
  const { address, isConnected, status } = useAppKitAccount()
  const { chainId, switchNetwork: appkitSwitch } = useAppKitNetwork()
  const { walletProvider } = useAppKitProvider('eip155')

  // 直接监听钱包原生事件:AppKit 的 hook 在切换账户/网络时偶尔不刷新,
  // 这里用 accountsChanged / chainChanged 做兜底,保证切号后立即拿到新地址。
  const [liveAccount, setLiveAccount] = useState<string | null>(null)
  const [liveChainId, setLiveChainId] = useState<number | null>(null)

  useEffect(() => {
    // 把 walletProvider 桥接给 lib/eth(供 readContract/writeContract 同步使用)
    setWalletProvider((walletProvider as Eip1193Provider) ?? null)

    const p = walletProvider as (Eip1193Provider & { on?: Function; removeListener?: Function }) | null
    if (!p?.on) {
      setLiveAccount(null)
      setLiveChainId(null)
      return
    }
    let active = true

    const onAccounts = (accs: unknown) => {
      if (!active) return
      const list = Array.isArray(accs) ? (accs as string[]) : []
      setLiveAccount(normalize(list[0] ?? null))
    }
    const onChain = (cid: unknown) => {
      if (!active) return
      const n = typeof cid === 'string' ? parseInt(cid, 16) : Number(cid)
      setLiveChainId(Number.isFinite(n) ? n : null)
    }

    // 初始同步一次当前账户/网络
    p.request?.({ method: 'eth_accounts' })
      .then((a: string[]) => active && setLiveAccount(normalize(a?.[0] ?? null)))
      .catch(() => {})
    p.request?.({ method: 'eth_chainId' })
      .then((c: string) => active && onChain(c))
      .catch(() => {})

    p.on('accountsChanged', onAccounts)
    p.on('chainChanged', onChain)
    return () => {
      active = false
      p.removeListener?.('accountsChanged', onAccounts)
      p.removeListener?.('chainChanged', onChain)
    }
  }, [walletProvider])

  // 原生事件优先(最新),AppKit hook 兜底
  const numericChainId =
    liveChainId ?? (typeof chainId === 'number' ? chainId : chainId ? Number(chainId) : null)
  const account = isConnected ? liveAccount ?? normalize(address) ?? null : null

  const connect = useCallback(() => open(), [open])
  const openAccount = useCallback(() => open({ view: 'Account' }), [open])
  const switchNetwork = useCallback(() => {
    try {
      appkitSwitch(targetNetwork)
    } catch {
      open({ view: 'Networks' })
    }
  }, [appkitSwitch, open])

  const connecting = status === 'connecting' || status === 'reconnecting'
  const wrongNetwork = account != null && numericChainId != null && numericChainId !== CHAIN.chainId

  return (
    <WalletContext.Provider
      value={{ account, chainId: numericChainId, connecting, wrongNetwork, connect, switchNetwork, openAccount }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
