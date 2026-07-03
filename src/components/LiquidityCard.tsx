import { useEffect, useMemo, useState } from 'react'
import { MaxUint256, ZeroAddress } from 'ethers'
import { useTranslation } from 'react-i18next'
import { CHAIN, DEFAULT_DEADLINE_MINUTES, isNative } from '../config'
import type { TokenInfo } from '../config'
import { ERC20_ABI, FACTORY_ABI, PAIR_ABI, ROUTER_ABI } from '../abis'
import { confirmTx, fmt, getProvider, readContract, toUnits, writeContract } from '../lib/eth'
import { useWallet } from '../wallet'
import { errMessage, useToast } from '../toast'
import { TokenModal } from './TokenModal'

const configured = CHAIN.router !== ZeroAddress && CHAIN.factory !== ZeroAddress
const pathAddr = (tk: TokenInfo) => (isNative(tk.address) ? CHAIN.wrappedNative : tk.address)
const withTolerance = (v: bigint) => (v * 995n) / 1000n // 0.5%

export function LiquidityCard() {
  const { t } = useTranslation()
  const { account, wrongNetwork, connect, switchNetwork } = useWallet()
  const toast = useToast()

  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [tokenA, setTokenA] = useState<TokenInfo>(CHAIN.tokens[0])
  const [tokenB, setTokenB] = useState<TokenInfo>(CHAIN.tokens[1] ?? CHAIN.tokens[0])
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState<null | 'a' | 'b'>(null)

  const [pairAddr, setPairAddr] = useState<string>(ZeroAddress)
  const [reserves, setReserves] = useState<{ a: bigint; b: bigint } | null>(null)
  const [lpBalance, setLpBalance] = useState<bigint>(0n)
  const [lpTotal, setLpTotal] = useState<bigint>(0n)
  const [percent, setPercent] = useState(50)

  const amountAWei = useMemo(() => toUnits(amountA, tokenA.decimals), [amountA, tokenA])
  const amountBWei = useMemo(() => toUnits(amountB, tokenB.decimals), [amountB, tokenB])

  // ---- load the pair (address, reserves, LP balance) ----
  async function loadPair() {
    setReserves(null)
    setLpBalance(0n)
    setLpTotal(0n)
    setPairAddr(ZeroAddress)
    if (!configured || tokenA.address === tokenB.address) return
    try {
      const factory = readContract(CHAIN.factory, FACTORY_ABI)
      const addr: string = await factory.getPair(pathAddr(tokenA), pathAddr(tokenB))
      setPairAddr(addr)
      if (addr === ZeroAddress) return
      const pair = readContract(addr, PAIR_ABI)
      const [token0, r, total] = await Promise.all([pair.token0(), pair.getReserves(), pair.totalSupply()])
      const aIsToken0 = token0.toLowerCase() === pathAddr(tokenA).toLowerCase()
      setReserves({ a: aIsToken0 ? r[0] : r[1], b: aIsToken0 ? r[1] : r[0] })
      setLpTotal(total)
      if (account) setLpBalance(await pair.balanceOf(account))
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadPair().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, tokenA, tokenB])

  // auto-fill amountB from the pool ratio while adding
  useEffect(() => {
    if (mode !== 'add' || !reserves || reserves.a <= 0n || amountAWei <= 0n) return
    const b = (amountAWei * reserves.b) / reserves.a
    setAmountB(fmt(b, tokenB.decimals, 8))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountAWei, reserves, mode])

  // 返回 false 表示授权交易超时未确认(多签较慢)——调用方应停下、提示稍后重试,而非继续。
  async function ensureApproved(token: TokenInfo, amount: bigint, spender: string): Promise<boolean> {
    if (isNative(token.address) || amount <= 0n) return true
    const c = readContract(token.address, ERC20_ABI)
    const current: bigint = await c.allowance(account, spender)
    if (current >= amount) return true
    const w = await writeContract(token.address, ERC20_ABI)
    const tx = await w.approve(spender, MaxUint256)
    toast.info(t('liquidity.toastApproveToken', { sym: token.symbol }))
    const st = await confirmTx(tx, {
      check: async () => (await readContract(token.address, ERC20_ABI).allowance(account, spender)) >= amount
    })
    if (st === 'pending') {
      toast.info(`${token.symbol} 授权已提交。多签确认后请重新点击「添加流动性」。`)
      return false
    }
    toast.success(t('liquidity.toastApproved', { sym: token.symbol }), tx.hash)
    return true
  }

  async function addLiquidity() {
    if (!account) return
    setBusy(true)
    try {
      const deadline = Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_MINUTES * 60
      if (!(await ensureApproved(tokenA, amountAWei, CHAIN.router))) return
      if (!(await ensureApproved(tokenB, amountBWei, CHAIN.router))) return
      const router = await writeContract(CHAIN.router, ROUTER_ABI)
      let tx
      if (isNative(tokenA.address) || isNative(tokenB.address)) {
        const [tok, tokAmt] = isNative(tokenA.address) ? [tokenB, amountBWei] : [tokenA, amountAWei]
        const ethAmt = isNative(tokenA.address) ? amountAWei : amountBWei
        tx = await router.addLiquidityETH(
          tok.address,
          tokAmt,
          withTolerance(tokAmt),
          withTolerance(ethAmt),
          account,
          deadline,
          { value: ethAmt }
        )
      } else {
        tx = await router.addLiquidity(
          tokenA.address,
          tokenB.address,
          amountAWei,
          amountBWei,
          withTolerance(amountAWei),
          withTolerance(amountBWei),
          account,
          deadline
        )
      }
      toast.info(t('liquidity.toastAdding'))
      const priorLp = lpBalance
      const added = await confirmTx(tx, {
        // 多签:轮询 LP 余额是否增加(新池则先解析 pair 地址),链上一生效就秒判成功
        check: async () => {
          let pa = pairAddr
          if (pa === ZeroAddress) {
            pa = await readContract(CHAIN.factory, FACTORY_ABI).getPair(pathAddr(tokenA), pathAddr(tokenB))
            if (pa === ZeroAddress) return false
          }
          return (await readContract(pa, PAIR_ABI).balanceOf(account)) > priorLp
        }
      })
      if (added === 'confirmed') toast.success(t('liquidity.toastAdded'), tx.hash)
      else toast.info('交易已提交。多签钱包确认较慢或需更多签名;链上确认后请手动刷新查看余额。')
      setAmountA('')
      setAmountB('')
      await loadPair()
    } catch (e) {
      toast.error(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function removeLiquidity() {
    if (!account || pairAddr === ZeroAddress) return
    setBusy(true)
    try {
      const deadline = Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_MINUTES * 60
      const liquidity = (lpBalance * BigInt(percent)) / 100n
      if (liquidity <= 0n) {
        toast.error(t('liquidity.toastNoLp'))
        return
      }
      // approve LP token to the router
      const pairW = await writeContract(pairAddr, PAIR_ABI)
      const allowance: bigint = await readContract(pairAddr, PAIR_ABI).allowance(account, CHAIN.router)
      if (allowance < liquidity) {
        const atx = await pairW.approve(CHAIN.router, MaxUint256)
        toast.info(t('liquidity.toastApproveLp'))
        const ast = await confirmTx(atx, {
          check: async () => (await readContract(pairAddr, PAIR_ABI).allowance(account, CHAIN.router)) >= liquidity
        })
        if (ast === 'pending') {
          toast.info('LP 授权已提交。多签确认后请重新点击「移除流动性」。')
          return
        }
      }
      // expected amounts from our pool share, minus tolerance
      const share = lpTotal > 0n ? liquidity : 0n
      const expA = reserves && lpTotal > 0n ? (reserves.a * share) / lpTotal : 0n
      const expB = reserves && lpTotal > 0n ? (reserves.b * share) / lpTotal : 0n
      const router = await writeContract(CHAIN.router, ROUTER_ABI)
      let tx
      if (isNative(tokenA.address) || isNative(tokenB.address)) {
        const [tok, expTok, expEth] = isNative(tokenA.address)
          ? [tokenB, expB, expA]
          : [tokenA, expA, expB]
        tx = await router.removeLiquidityETH(
          tok.address,
          liquidity,
          withTolerance(expTok),
          withTolerance(expEth),
          account,
          deadline
        )
      } else {
        tx = await router.removeLiquidity(
          tokenA.address,
          tokenB.address,
          liquidity,
          withTolerance(expA),
          withTolerance(expB),
          account,
          deadline
        )
      }
      toast.info(t('liquidity.toastRemoving'))
      const priorLp = lpBalance
      const removed = await confirmTx(tx, {
        check: async () => (await readContract(pairAddr, PAIR_ABI).balanceOf(account)) < priorLp
      })
      if (removed === 'confirmed') toast.success(t('liquidity.toastRemoved'), tx.hash)
      else toast.info('交易已提交。多签钱包确认较慢或需更多签名;链上确认后请手动刷新查看。')
      await loadPair()
    } catch (e) {
      toast.error(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const sameToken = tokenA.address === tokenB.address
  const action = (() => {
    if (!account) return { label: t('wallet.connect'), onClick: connect, disabled: false }
    if (wrongNetwork) return { label: t('wallet.switchTo', { network: CHAIN.name }), onClick: switchNetwork, disabled: false }
    if (!configured) return { label: t('liquidity.btnNotConfigured'), onClick: () => {}, disabled: true }
    if (sameToken) return { label: t('liquidity.btnPickDifferent'), onClick: () => {}, disabled: true }
    if (mode === 'add') {
      if (amountAWei <= 0n || amountBWei <= 0n) return { label: t('liquidity.btnEnterAmount'), onClick: () => {}, disabled: true }
      return { label: busy ? t('liquidity.btnProcessing') : t('liquidity.btnAdd'), onClick: addLiquidity, disabled: busy }
    }
    if (lpBalance <= 0n) return { label: t('liquidity.btnNoLp'), onClick: () => {}, disabled: true }
    return { label: busy ? t('liquidity.btnProcessing') : t('liquidity.btnRemove'), onClick: removeLiquidity, disabled: busy }
  })()

  return (
    <div className="card">
      <div className="card-head">
        <h2>{t('liquidity.title')}</h2>
        <div className="seg">
          <button className={mode === 'add' ? 'seg-btn active' : 'seg-btn'} onClick={() => setMode('add')}>
            {t('liquidity.add')}
          </button>
          <button className={mode === 'remove' ? 'seg-btn active' : 'seg-btn'} onClick={() => setMode('remove')}>
            {t('liquidity.remove')}
          </button>
        </div>
      </div>

      {!configured && (
        <div className="banner">⚠ {t('liquidity.configBanner')}</div>
      )}

      {/* token pair pickers */}
      <div className="pair-pickers">
        <button className="token-pick wide" onClick={() => setModal('a')}>
          <span className="token-icon sm">{tokenA.symbol.slice(0, 3)}</span>
          {tokenA.symbol} ▾
        </button>
        <span className="plus">+</span>
        <button className="token-pick wide" onClick={() => setModal('b')}>
          <span className="token-icon sm">{tokenB.symbol.slice(0, 3)}</span>
          {tokenB.symbol} ▾
        </button>
      </div>

      {mode === 'add' ? (
        <>
          <div className="swap-box">
            <div className="swap-box-top">
              <span>{t('liquidity.amountOf', { sym: tokenA.symbol })}</span>
            </div>
            <input
              className="amount-input full"
              placeholder="0.0"
              inputMode="decimal"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value.replace(/[^0-9.]/g, ''))}
            />
          </div>
          <div className="swap-box">
            <div className="swap-box-top">
              <span>{t('liquidity.amountOf', { sym: tokenB.symbol })}</span>
            </div>
            <input
              className="amount-input full"
              placeholder="0.0"
              inputMode="decimal"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value.replace(/[^0-9.]/g, ''))}
            />
          </div>
          {pairAddr === ZeroAddress && !sameToken && (
            <div className="hint">{t('liquidity.newPairHint')}</div>
          )}
        </>
      ) : (
        <div className="remove-box">
          <div className="lp-balance">
            {t('liquidity.yourLp')}:{fmt(lpBalance, 18)}
          </div>
          <div className="percent-big">{percent}%</div>
          <input
            type="range"
            min={1}
            max={100}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            className="slider"
          />
          <div className="percent-chips">
            {[25, 50, 75, 100].map((p) => (
              <button key={p} className={percent === p ? 'chip active' : 'chip'} onClick={() => setPercent(p)}>
                {p}%
              </button>
            ))}
          </div>
          {reserves && lpTotal > 0n && (
            <div className="quote-info">
              <div>
                <span>{t('liquidity.estReceive')}</span>
                <span>
                  {fmt((reserves.a * ((lpBalance * BigInt(percent)) / 100n)) / lpTotal, tokenA.decimals)} {tokenA.symbol}
                </span>
              </div>
              <div>
                <span></span>
                <span>
                  {fmt((reserves.b * ((lpBalance * BigInt(percent)) / 100n)) / lpTotal, tokenB.decimals)} {tokenB.symbol}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <button className="btn btn-primary btn-block btn-action" onClick={action.onClick} disabled={action.disabled}>
        {action.label}
      </button>

      <TokenModal
        open={modal !== null}
        onClose={() => setModal(null)}
        exclude={modal === 'a' ? tokenB.address : tokenA.address}
        onSelect={(t) => (modal === 'a' ? setTokenA(t) : setTokenB(t))}
      />
    </div>
  )
}
