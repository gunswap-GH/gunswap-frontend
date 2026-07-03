import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { getAddress } from 'ethers'
import { useTranslation } from 'react-i18next'
import { CHAIN, isNative } from '../config'
import type { TokenInfo } from '../config'
import { readContract, shortAddr, fmt } from '../lib/eth'
import { multicall, ethBalanceCall, erc20BalanceCall } from '../lib/multicall'
import { cleanSym, cleanText } from '../lib/sanitize'
import { ERC20_ABI } from '../abis'
import { useWallet } from '../wallet'
import { tokenIconSrc } from './TokenIcon'

// 行内小图标:复制 / 在浏览器打开(BscScan)
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)
const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" />
  </svg>
)

// 选币头像:有图标(按地址/符号)就显示真 logo,否则字母占位。保持弹窗自己的 .token-icon(30px 圆)样式。
function TokenAvatar({ symbol, address }: { symbol: string; address?: string }) {
  const src = tokenIconSrc(symbol, address)
  return src ? (
    <img className="token-icon" src={src} alt={symbol} style={{ objectFit: 'cover' }} />
  ) : (
    <span className="token-icon">{cleanSym(symbol).slice(0, 3)}</span>
  )
}

const STORE_KEY = `gunswap.tokens.${CHAIN.chainId}`

// 任意大小写的 0x + 40 位十六进制都当作地址(不强制 EIP-55 校验和),
// 避免用户从浏览器/钱包复制来的非校验和地址被拒、导致「搜不到」。
const ADDR_RE = /^0x[0-9a-fA-F]{40}$/

function loadCustom(): TokenInfo[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]')
  } catch {
    return []
  }
}
function saveCustom(list: TokenInfo[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list))
}

export function useTokenList(): [TokenInfo[], (t: TokenInfo) => void] {
  const [custom, setCustom] = useState<TokenInfo[]>(loadCustom())
  const add = (t: TokenInfo) => {
    const next = [...custom.filter((x) => x.address.toLowerCase() !== t.address.toLowerCase()), t]
    setCustom(next)
    saveCustom(next)
  }
  // 关键:固定数组引用。否则每次渲染都生成新数组,会让依赖它的 effect
  // 反复触发(导入项闪烁、搜不到、狂打 RPC 的根因)。
  const all = useMemo(() => [...CHAIN.tokens, ...custom], [custom])
  return [all, add]
}

export function TokenModal({
  open,
  onClose,
  onSelect,
  exclude
}: {
  open: boolean
  onClose: () => void
  onSelect: (t: TokenInfo) => void
  exclude?: string
}) {
  const { t } = useTranslation()
  const { account } = useWallet()
  const [list, addToken] = useTokenList()
  const [query, setQuery] = useState('')
  const [importing, setImporting] = useState<TokenInfo | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  // 待用户二次确认的导入代币(风险提示面板)
  const [confirm, setConfirm] = useState<TokenInfo | null>(null)
  // 各代币余额(按地址小写) + 复制反馈
  const [balances, setBalances] = useState<Record<string, bigint>>({})
  const [copied, setCopied] = useState<string | null>(null)

  // 打开且已连接钱包时,拉取列表内每个代币的余额(原生币读链上余额,ERC20 读 balanceOf)
  useEffect(() => {
    if (!open || !account) {
      setBalances({})
      return
    }
    let cancelled = false
    ;(async () => {
      // 列表里所有币的余额一次 multicall 读回(原生币走 Multicall3.getEthBalance)
      try {
        const res = await multicall(
          list.map((tk) => (isNative(tk.address) ? ethBalanceCall(account) : erc20BalanceCall(tk.address, account)))
        )
        const entries = list.map((tk, i) => [tk.address.toLowerCase(), typeof res[i] === 'bigint' ? res[i] : 0n] as const)
        if (!cancelled) setBalances(Object.fromEntries(entries))
      } catch {
        /* 读不到就保持空,不阻塞选币 */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, account, list])

  function copyAddress(addr: string, e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard
      ?.writeText(addr)
      .then(() => {
        setCopied(addr)
        setTimeout(() => setCopied((c) => (c === addr ? null : c)), 1200)
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (!open) {
      setQuery('')
      setImporting(null)
      setError('')
      setSearching(false)
      setConfirm(null)
    }
  }, [open])

  function doImport(tk: TokenInfo) {
    addToken(tk)
    onSelect(tk)
    onClose()
  }

  useEffect(() => {
    setError('')
    setImporting(null)
    setSearching(false)
    const q = query.trim()
    if (!ADDR_RE.test(q)) return
    // 已经在列表里就不必再读链上
    if (list.some((tk) => tk.address.toLowerCase() === q.toLowerCase())) return

    let cancelled = false
    setSearching(true)
    ;(async () => {
      try {
        const c = readContract(q, ERC20_ABI)
        const [symbol, name, decimals] = await Promise.all([c.symbol(), c.name(), c.decimals()])
        if (cancelled) return
        let address = q
        try {
          address = getAddress(q) // 规范化为校验和地址;失败则保留原值
        } catch {
          /* keep raw */
        }
        // 净化 symbol/name:剥离零宽/双向控制字符 + 截断,防钓鱼伪装
        setImporting({ symbol: cleanSym(String(symbol)), name: cleanText(String(name)), address, decimals: Number(decimals) })
      } catch {
        if (!cancelled) setError(t('tokenModal.invalid'))
      } finally {
        if (!cancelled) setSearching(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [query, list])

  if (!open) return null

  const filtered = list.filter((tk) => {
    if (exclude && tk.address === exclude) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return tk.symbol.toLowerCase().includes(q) || tk.name.toLowerCase().includes(q) || tk.address.toLowerCase().includes(q)
  })

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{t('tokenModal.title')}</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {confirm ? (
          /* ---- 导入前风险确认 ---- */
          <div className="import-confirm">
            <div className="import-token-card">
              <TokenAvatar symbol={confirm.symbol} address={confirm.address} />
              <span className="token-meta">
                <span className="token-symbol">{confirm.symbol}</span>
                <span className="token-name">{confirm.name}</span>
              </span>
              <span className="import-source">{t('tokenModal.unknownSource')}</span>
            </div>

            <div className="import-addr">
              <span>{shortAddr(confirm.address)}</span>
              <a href={`${CHAIN.blockExplorer}/token/${confirm.address}`} target="_blank" rel="noreferrer">
                {t('tokenModal.viewOnExplorer')} ↗
              </a>
            </div>

            <div className="import-warning">
              <span className="warn-icon" aria-hidden>
                ⚠
              </span>
              <p>{t('tokenModal.importWarning')}</p>
            </div>

            <div className="import-actions">
              <button className="btn-soft" onClick={() => setConfirm(null)}>
                {t('tokenModal.cancel')}
              </button>
              <button className="btn btn-primary btn-block" onClick={() => doImport(confirm)}>
                {t('tokenModal.import')}
              </button>
            </div>
          </div>
        ) : (
          /* ---- 搜索 + 列表 ---- */
          <>
            <input
              className="input search"
              placeholder={t('tokenModal.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              /* 只在桌面端自动聚焦;触屏设备不聚焦,避免手机一打开选币就弹出键盘 */
              autoFocus={!window.matchMedia?.('(pointer: coarse)')?.matches}
            />
            {searching && <div className="hint">{t('tokenModal.searching')}</div>}
            {error && <div className="hint hint-error">{error}</div>}

            <div className="token-list">
              {importing && (
                <button className="token-row import" onClick={() => setConfirm(importing)}>
                  <TokenAvatar symbol={importing.symbol} address={importing.address} />
                  <span className="token-meta">
                    <span className="token-symbol">{importing.symbol}</span>
                    <span className="token-name">{importing.name} · {t('tokenModal.clickImport')}</span>
                  </span>
                  <span className="import-tag">{t('tokenModal.import')}</span>
                </button>
              )}
              {filtered.map((tk) => {
                const select = () => {
                  onSelect(tk)
                  onClose()
                }
                const bal = balances[tk.address.toLowerCase()]
                return (
                  <div
                    key={tk.address}
                    className="token-row"
                    role="button"
                    tabIndex={0}
                    onClick={select}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        select()
                      }
                    }}
                  >
                    <TokenAvatar symbol={tk.symbol} address={tk.address} />
                    <span className="token-meta">
                      <span className="token-symline">
                        <span className="token-symbol">{cleanSym(tk.symbol)}</span>
                        {!isNative(tk.address) && (
                          <span className="token-acts">
                            <button
                              type="button"
                              className="tok-act"
                              data-tip={copied === tk.address ? '已复制' : '复制代币地址'}
                              aria-label="复制代币地址"
                              onClick={(e) => copyAddress(tk.address, e)}
                            >
                              {copied === tk.address ? '✓' : <CopyIcon />}
                            </button>
                            <a
                              className="tok-act"
                              data-tip="在浏览器中打开"
                              aria-label="在 BscScan 查看合约"
                              href={`${CHAIN.blockExplorer}/token/${tk.address}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <LinkIcon />
                            </a>
                          </span>
                        )}
                      </span>
                      <span className="token-name">{isNative(tk.address) ? t('tokenModal.native') : cleanText(tk.name)}</span>
                    </span>
                    <span className="token-bal">{account ? (bal !== undefined ? fmt(bal, tk.decimals, 5) : '…') : ''}</span>
                  </div>
                )
              })}
              {filtered.length === 0 && !importing && !searching && !error && (
                <div className="hint">{t('tokenModal.empty')}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
