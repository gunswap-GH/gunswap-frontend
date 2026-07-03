import { useEffect, useMemo, useState } from 'react'
import { MaxUint256, ZeroAddress } from 'ethers'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CHAIN, DEFAULT_DEADLINE_MINUTES, isNative } from '../config'
import type { TokenInfo } from '../config'
import { ERC20_ABI, FACTORY_ABI, ROUTER_ABI } from '../abis'
import { confirmTx, fmt, getProvider, readContract, toUnits, writeContract } from '../lib/eth'
import { fmtFee } from '../lib/num'
import { useWallet } from '../wallet'
import { errMessage, useToast } from '../toast'
import { TokenModal } from './TokenModal'

const configured = CHAIN.router !== ZeroAddress && CHAIN.factory !== ZeroAddress
const pathAddr = (t: TokenInfo) => (isNative(t.address) ? CHAIN.wrappedNative : t.address)
const withTol = (v: bigint) => (v * 995n) / 1000n

export function CreatePoolCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { account, wrongNetwork, connect, switchNetwork } = useWallet()
  const toast = useToast()

  const [tokenA, setTokenA] = useState<TokenInfo>(CHAIN.tokens[0])
  const [tokenB, setTokenB] = useState<TokenInfo>(CHAIN.tokens[1] ?? CHAIN.tokens[0])
  const [price, setPrice] = useState('') // 1 A = ? B
  const [amountA, setAmountA] = useState('')
  const [feeBps, setFeeBps] = useState(30)
  const [exists, setExists] = useState<boolean | null>(null)
  const [balanceA, setBalanceA] = useState<bigint>(0n)
  const [allowanceA, setAllowanceA] = useState<bigint>(0n)
  const [allowanceB, setAllowanceB] = useState<bigint>(0n)
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState<null | 'a' | 'b'>(null)

  const sameToken = tokenA.address === tokenB.address
  const amountAWei = useMemo(() => toUnits(amountA, tokenA.decimals), [amountA, tokenA])
  const priceNum = Number(price)
  const amountB = useMemo(() => {
    if (!amountA || !priceNum || isNaN(priceNum) || priceNum <= 0) return ''
    const v = Number(amountA) * priceNum
    return isFinite(v) ? String(v) : ''
  }, [amountA, priceNum])
  const amountBWei = useMemo(() => toUnits(amountB, tokenB.decimals), [amountB, tokenB])

  // 检测交易对是否已存在 + 读取手续费档
  useEffect(() => {
    setExists(null)
    if (!configured || sameToken) return
    let cancelled = false
    ;(async () => {
      try {
        const factory = readContract(CHAIN.factory, FACTORY_ABI)
        const pair: string = await factory.getPair(pathAddr(tokenA), pathAddr(tokenB))
        if (cancelled) return
        const ex = pair !== ZeroAddress
        setExists(ex)
        try {
          const fee = ex ? await factory.swapFee(pair) : await factory.defaultSwapFee()
          if (!cancelled) setFeeBps(Number(fee))
        } catch {
          /* 保留默认 */
        }
      } catch {
        if (!cancelled) setExists(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tokenA, tokenB, sameToken])

  // 余额 + 授权
  async function loadBal() {
    if (!account) {
      setBalanceA(0n)
      setAllowanceA(0n)
      setAllowanceB(0n)
      return
    }
    const provider = getProvider()
    setBalanceA(isNative(tokenA.address) ? await provider.getBalance(account) : await readContract(tokenA.address, ERC20_ABI).balanceOf(account))
    setAllowanceA(isNative(tokenA.address) ? MaxUint256 : await readContract(tokenA.address, ERC20_ABI).allowance(account, CHAIN.router))
    setAllowanceB(isNative(tokenB.address) ? MaxUint256 : await readContract(tokenB.address, ERC20_ABI).allowance(account, CHAIN.router))
  }
  useEffect(() => {
    loadBal().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, tokenA, tokenB])

  const needApprove =
    (!isNative(tokenA.address) && amountAWei > 0n && allowanceA < amountAWei) ||
    (!isNative(tokenB.address) && amountBWei > 0n && allowanceB < amountBWei)

  // 返回 false 表示授权超时未确认(多签较慢)——调用方应停下、提示稍后重试。
  async function ensureApproved(token: TokenInfo, amount: bigint): Promise<boolean> {
    if (isNative(token.address) || amount <= 0n) return true
    const cur: bigint = await readContract(token.address, ERC20_ABI).allowance(account, CHAIN.router)
    if (cur >= amount) return true
    const w = await writeContract(token.address, ERC20_ABI)
    const tx = await w.approve(CHAIN.router, MaxUint256)
    toast.info(`授权 ${token.symbol}…`)
    const st = await confirmTx(tx, {
      check: async () => (await readContract(token.address, ERC20_ABI).allowance(account, CHAIN.router)) >= amount
    })
    if (st === 'pending') {
      toast.info(`${token.symbol} 授权已提交。多签确认后请重新点击「创建」。`)
      return false
    }
    toast.success(`${token.symbol} ${t('createPool.approved')}`, tx.hash)
    return true
  }

  async function create() {
    if (!account) return
    setBusy(true)
    try {
      if (!(await ensureApproved(tokenA, amountAWei))) return
      if (!(await ensureApproved(tokenB, amountBWei))) return
      const deadline = Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_MINUTES * 60
      const router = await writeContract(CHAIN.router, ROUTER_ABI)
      let tx
      if (isNative(tokenA.address) || isNative(tokenB.address)) {
        const [tok, tokAmt] = isNative(tokenA.address) ? [tokenB, amountBWei] : [tokenA, amountAWei]
        const ethAmt = isNative(tokenA.address) ? amountAWei : amountBWei
        tx = await router.addLiquidityETH(tok.address, tokAmt, withTol(tokAmt), withTol(ethAmt), account, deadline, { value: ethAmt })
      } else {
        tx = await router.addLiquidity(tokenA.address, tokenB.address, amountAWei, amountBWei, withTol(amountAWei), withTol(amountBWei), account, deadline)
      }
      toast.info(t('createPool.creating'))
      const created = await confirmTx(tx, {
        // 多签:轮询 pair 是否已建出且自己有了 LP,链上一生效就秒判成功
        check: async () => {
          const pa: string = await readContract(CHAIN.factory, FACTORY_ABI).getPair(pathAddr(tokenA), pathAddr(tokenB))
          if (pa === ZeroAddress) return false
          return (await readContract(pa, ERC20_ABI).balanceOf(account)) > 0n
        }
      })
      if (created === 'confirmed') {
        toast.success(t('createPool.created'), tx.hash)
        navigate('/liquidity')
      } else {
        toast.info('建池交易已提交。多签钱包确认较慢或需更多签名;链上确认后请到「流动性」页查看。')
      }
    } catch (e) {
      toast.error(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  function setMax() {
    const reserve = isNative(tokenA.address) ? toUnits('0.01', 18) : 0n
    const usable = balanceA > reserve ? balanceA - reserve : 0n
    setAmountA(fmt(usable, tokenA.decimals, 8))
  }

  const disabledForm = exists === true // 已存在则下方表单置灰

  const action = (() => {
    if (!account) return { label: t('wallet.connect'), onClick: connect, disabled: false }
    if (wrongNetwork) return { label: t('wallet.switchTo', { network: CHAIN.name }), onClick: switchNetwork, disabled: false }
    if (!configured) return { label: t('createPool.notConfigured'), onClick: () => {}, disabled: true }
    if (sameToken) return { label: t('createPool.pickDifferent'), onClick: () => {}, disabled: true }
    if (exists === true) return { label: t('pools.add'), onClick: () => navigate('/liquidity/add'), disabled: false }
    if (!priceNum || priceNum <= 0) return { label: t('createPool.setPriceFirst'), onClick: () => {}, disabled: true }
    if (amountAWei <= 0n) return { label: t('createPool.enterAmount'), onClick: () => {}, disabled: true }
    if (amountAWei > balanceA) return { label: t('createPool.insufficient', { sym: tokenA.symbol }), onClick: () => {}, disabled: true }
    if (needApprove) return { label: busy ? '…' : `${t('createPool.approve')} ${tokenA.symbol}/${tokenB.symbol}`, onClick: create, disabled: busy }
    return { label: busy ? t('createPool.creating') : t('createPool.title'), onClick: create, disabled: busy }
  })()

  return (
    <div className="card create-card">
      {/* 选择代币对 */}
      <div className="field-label">{t('createPool.selectPair')}</div>
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

      {/* 已存在提示 */}
      {exists === true && (
        <div className="banner banner-info">
          <span>{t('createPool.exists')}</span>
          <button className="btn btn-primary" onClick={() => navigate('/liquidity/add')}>
            {t('pools.add')}
          </button>
        </div>
      )}

      {!configured && <div className="banner">{t('createPool.notConfiguredHint')}</div>}

      {/* 手续费 + 初始价格 */}
      <div className={disabledForm ? 'create-grid is-disabled' : 'create-grid'}>
        <div>
          <div className="field-label">{t('createPool.feeTier')}</div>
          <div className="fee-badge">{fmtFee(feeBps)}</div>
        </div>
        <div className="price-col">
          <div className="field-label">{t('createPool.setInitialPrice')}</div>
          <div className="price-box">
            <input
              className="price-input"
              placeholder="0.00"
              inputMode="decimal"
              value={price}
              disabled={disabledForm}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
            />
            <span className="price-unit">
              {tokenB.symbol} = 1 {tokenA.symbol}
            </span>
          </div>
        </div>
      </div>

      {/* 输入金额 */}
      <div className={disabledForm ? 'is-disabled' : ''}>
        <div className="field-label mt">{t('createPool.enterAmounts')}</div>
        <div className="swap-box">
          <div className="swap-box-top">
            <span>{tokenA.symbol}</span>
            {account && (
              <span className="balance">
                {fmt(balanceA, tokenA.decimals)}{' '}
                <button className="max-btn" onClick={setMax} disabled={disabledForm}>
                  {t('createPool.max')}
                </button>
              </span>
            )}
          </div>
          <div className="swap-box-row">
            <input
              className="amount-input"
              placeholder="0.0"
              inputMode="decimal"
              value={amountA}
              disabled={disabledForm}
              onChange={(e) => setAmountA(e.target.value.replace(/[^0-9.]/g, ''))}
            />
            <span className="token-icon sm">{tokenA.symbol.slice(0, 3)}</span>
          </div>
        </div>
        <div className="swap-box">
          <div className="swap-box-top">
            <span>{tokenB.symbol}</span>
            <span className="hint-mini">{t('createPool.autoByPrice')}</span>
          </div>
          <div className="swap-box-row">
            <input className="amount-input" placeholder="0.0" value={amountB ? fmt(amountBWei, tokenB.decimals, 8) : ''} readOnly />
            <span className="token-icon sm">{tokenB.symbol.slice(0, 3)}</span>
          </div>
        </div>
      </div>

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
