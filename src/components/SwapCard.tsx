import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MaxUint256, ZeroAddress } from 'ethers'
import { useTranslation } from 'react-i18next'
import { CHAIN, DEFAULT_DEADLINE_MINUTES, DEFAULT_SLIPPAGE, isNative } from '../config'
import type { TokenInfo } from '../config'
import { ERC20_ABI, ROUTER_ABI } from '../abis'
import { confirmTx, fmt, getProvider, readContract, toUnits, writeContract } from '../lib/eth'
import { useWallet } from '../wallet'
import { errMessage, useToast } from '../toast'
import { TokenModal } from './TokenModal'
import { TokenIcon } from './TokenIcon'
import iconCaret from '../assets/icon-caret.svg'
import iconFlip from '../assets/icon-flip.svg'
import iconWarn from '../assets/icon-warn.svg'

const routerConfigured = CHAIN.router !== ZeroAddress
const pathAddr = (t: TokenInfo) => (isNative(t.address) ? CHAIN.wrappedNative : t.address)

export function SwapCard() {
  const { t } = useTranslation()
  const { account, wrongNetwork, connect, switchNetwork } = useWallet()
  const toast = useToast()

  // 从资金池「交易」按钮跳转时,会带 location.state.swapIn/swapOut 预填两个币(可为非精选/导入币)
  const navState = (useLocation().state || {}) as { swapIn?: TokenInfo; swapOut?: TokenInfo }
  const [tokenIn, setTokenIn] = useState<TokenInfo>(navState.swapIn ?? CHAIN.tokens[0])
  const [tokenOut, setTokenOut] = useState<TokenInfo>(navState.swapOut ?? CHAIN.tokens[1] ?? CHAIN.tokens[0])
  const [amountIn, setAmountIn] = useState('')
  const [amountOutRaw, setAmountOutRaw] = useState<bigint>(0n)

  const [balanceIn, setBalanceIn] = useState<bigint>(0n)
  const [balanceOut, setBalanceOut] = useState<bigint>(0n)
  const [allowance, setAllowance] = useState<bigint>(0n)

  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE)
  const [isAuto, setIsAuto] = useState(true) // 滑点"自动"模式(默认),= DEFAULT_SLIPPAGE
  const [deadlineMin] = useState(DEFAULT_DEADLINE_MINUTES)

  const [quoting, setQuoting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [noPair, setNoPair] = useState(false)
  const [modal, setModal] = useState<null | 'in' | 'out'>(null)

  const amountInWei = useMemo(() => toUnits(amountIn, tokenIn.decimals), [amountIn, tokenIn])
  const needsApprove = !isNative(tokenIn.address) && amountInWei > 0n && allowance < amountInWei

  // ---- load balances + allowance ----
  async function loadBalances() {
    if (!account) {
      setBalanceIn(0n)
      setBalanceOut(0n)
      setAllowance(0n)
      return
    }
    const provider = getProvider()
    const getBal = async (t: TokenInfo) =>
      isNative(t.address) ? provider.getBalance(account) : (await readContract(t.address, ERC20_ABI).balanceOf(account))
    setBalanceIn(await getBal(tokenIn))
    setBalanceOut(await getBal(tokenOut))
    if (isNative(tokenIn.address)) setAllowance(MaxUint256)
    else setAllowance(await readContract(tokenIn.address, ERC20_ABI).allowance(account, CHAIN.router))
  }

  useEffect(() => {
    loadBalances().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, tokenIn, tokenOut])

  // ---- live quote (debounced) ----
  useEffect(() => {
    setNoPair(false)
    if (!routerConfigured || amountInWei <= 0n || tokenIn.address === tokenOut.address) {
      setAmountOutRaw(0n)
      return
    }
    let cancelled = false
    setQuoting(true)
    const handle = setTimeout(async () => {
      try {
        const router = readContract(CHAIN.router, ROUTER_ABI)
        const amounts: bigint[] = await router.getAmountsOut(amountInWei, [pathAddr(tokenIn), pathAddr(tokenOut)])
        if (!cancelled) setAmountOutRaw(amounts[amounts.length - 1])
      } catch {
        if (!cancelled) {
          setAmountOutRaw(0n)
          setNoPair(true)
        }
      } finally {
        if (!cancelled) setQuoting(false)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [amountInWei, tokenIn, tokenOut])

  const minReceived = useMemo(() => {
    if (amountOutRaw <= 0n) return 0n
    const bps = BigInt(Math.round((100 - slippage) * 100))
    return (amountOutRaw * bps) / 10000n
  }, [amountOutRaw, slippage])

  const price = useMemo(() => {
    if (amountInWei <= 0n || amountOutRaw <= 0n) return null
    const out = Number(fmt(amountOutRaw, tokenOut.decimals, 8))
    const inp = Number(amountIn)
    if (!inp) return null
    return out / inp
  }, [amountInWei, amountOutRaw, amountIn, tokenOut])

  function flip() {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
    setAmountOutRaw(0n)
  }

  function setMax() {
    // leave a little native coin for gas
    const reserve = isNative(tokenIn.address) ? toUnits('0.005', 18) : 0n
    const usable = balanceIn > reserve ? balanceIn - reserve : 0n
    setAmountIn(fmt(usable, tokenIn.decimals, 8))
  }

  async function approve() {
    setBusy(true)
    try {
      const c = await writeContract(tokenIn.address, ERC20_ABI)
      const tx = await c.approve(CHAIN.router, MaxUint256)
      toast.info(t('swap.toastApproving'))
      const st = await confirmTx(tx, {
        check: async () => (await readContract(tokenIn.address, ERC20_ABI).allowance(account, CHAIN.router)) >= amountInWei
      })
      if (st === 'confirmed') toast.success(t('swap.toastApproved'), tx.hash)
      else toast.info('授权已提交。多签确认后请重新点击「交换」。')
      await loadBalances()
    } catch (e) {
      toast.error(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function swap() {
    if (!account) return
    setBusy(true)
    try {
      // 记录交易前的「收到币」余额,多签时用来轮询是否到账(链上一生效就秒判成功)
      const priorOut: bigint = isNative(tokenOut.address)
        ? await getProvider().getBalance(account)
        : await readContract(tokenOut.address, ERC20_ABI).balanceOf(account)
      const router = await writeContract(CHAIN.router, ROUTER_ABI)
      const deadline = Math.floor(Date.now() / 1000) + deadlineMin * 60
      const path = [pathAddr(tokenIn), pathAddr(tokenOut)]
      let tx
      // 统一用 SupportingFeeOnTransfer 变体:对无税币完全等价,对带税币(fee-on-transfer)才能正常成交。
      // 带税币需用户把滑点调高到覆盖税率,否则 minReceived 会触发 revert。
      // 且带税交易的 estimateGas 常偏低 → 手动给足 gasLimit 防 out-of-gas(gasLimit 只是上限,只扣实际用量,不浪费)。
      const GAS = 600000n
      if (isNative(tokenIn.address)) {
        tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(minReceived, path, account, deadline, { value: amountInWei, gasLimit: GAS })
      } else if (isNative(tokenOut.address)) {
        tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(amountInWei, minReceived, path, account, deadline, { gasLimit: GAS })
      } else {
        tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(amountInWei, minReceived, path, account, deadline, { gasLimit: GAS })
      }
      toast.info(t('swap.toastSwapping'))
      const swapped = await confirmTx(tx, {
        check: async () => {
          const cur: bigint = isNative(tokenOut.address)
            ? await getProvider().getBalance(account)
            : await readContract(tokenOut.address, ERC20_ABI).balanceOf(account)
          return cur > priorOut
        }
      })
      if (swapped === 'confirmed')
        toast.success(t('swap.toastSwapped', { amount: amountIn, from: tokenIn.symbol, to: tokenOut.symbol }), tx.hash)
      else toast.info('交易已提交。多签钱包确认较慢或需更多签名;链上确认后请手动刷新查看余额。')
      setAmountIn('')
      setAmountOutRaw(0n)
      await loadBalances()
    } catch (e) {
      toast.error(errMessage(e))
    } finally {
      setBusy(false)
    }
  }

  // ---- main action button state ----
  const action = (() => {
    if (!account) return { label: t('wallet.connect'), onClick: connect, disabled: false }
    if (wrongNetwork) return { label: t('wallet.switchTo', { network: CHAIN.name }), onClick: switchNetwork, disabled: false }
    if (!routerConfigured) return { label: t('swap.btnNotConfigured'), onClick: () => {}, disabled: true }
    if (tokenIn.address === tokenOut.address) return { label: t('swap.btnPickDifferent'), onClick: () => {}, disabled: true }
    if (amountInWei <= 0n) return { label: t('swap.btnEnterAmount'), onClick: () => {}, disabled: true }
    if (amountInWei > balanceIn) return { label: t('swap.btnInsufficient', { sym: tokenIn.symbol }), onClick: () => {}, disabled: true }
    if (noPair) return { label: t('swap.btnNoPair'), onClick: () => {}, disabled: true }
    if (needsApprove) return { label: busy ? t('swap.btnApproving') : t('swap.btnApprove', { sym: tokenIn.symbol }), onClick: approve, disabled: busy }
    return { label: busy ? t('swap.btnSwapping') : t('swap.btnSwap'), onClick: swap, disabled: busy || amountOutRaw <= 0n }
  })()

  return (
    <div className="sw-card">
      <h2 className="sw-title">{t('swap.title')}</h2>

      {!routerConfigured && (
        <div className="sw-banner">
          <img src={iconWarn} alt="" />
          {t('swap.configBanner')}
        </div>
      )}

      {/* FROM */}
      <div className="sw-row">
        <div className="sw-box">
          <span className="sw-label">{t('swap.sell')}</span>
          <i className="sw-sep" />
          <input
            className="sw-input"
            placeholder="0.0"
            inputMode="decimal"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value.replace(/[^0-9.]/g, ''))}
          />
          {account && (
            <span className="sw-bal">
              {t('swap.balance')} {fmt(balanceIn, tokenIn.decimals)}
              <button className="max-btn" onClick={setMax}>
                {t('swap.max')}
              </button>
            </span>
          )}
        </div>
        <button className="sw-pill" onClick={() => setModal('in')}>
          <TokenIcon symbol={tokenIn.symbol} address={tokenIn.address} />
          <span className="sw-pill-sym">{tokenIn.symbol}</span>
          <img className="sw-caret" src={iconCaret} alt="" />
        </button>
      </div>

      <div className="sw-flip-wrap">
        <button className="sw-flip" onClick={flip} title={t('swap.flip')}>
          <img src={iconFlip} alt="" />
        </button>
      </div>

      {/* TO */}
      <div className="sw-row">
        <div className="sw-box">
          <span className="sw-label">{t('swap.buy')}</span>
          <i className="sw-sep" />
          <input
            className="sw-input"
            placeholder="0.0"
            value={quoting ? '…' : amountOutRaw > 0n ? fmt(amountOutRaw, tokenOut.decimals, 8) : ''}
            readOnly
          />
          {account && (
            <span className="sw-bal">
              {t('swap.balance')} {fmt(balanceOut, tokenOut.decimals)}
            </span>
          )}
        </div>
        <button className="sw-pill" onClick={() => setModal('out')}>
          <TokenIcon symbol={tokenOut.symbol} address={tokenOut.address} />
          <span className="sw-pill-sym">{tokenOut.symbol}</span>
          <img className="sw-caret" src={iconCaret} alt="" />
        </button>
      </div>

      <button className="sw-cta" onClick={action.onClick} disabled={action.disabled}>
        {action.label}
      </button>

      {amountOutRaw > 0n && price && (
        <div className="quote-info">
          <div>
            <span>{t('swap.price')}</span>
            <span>
              1 {tokenIn.symbol} ≈ {price.toPrecision(6)} {tokenOut.symbol}
            </span>
          </div>
          <div>
            <span>{t('swap.minReceived', { slippage })}</span>
            <span>
              {fmt(minReceived, tokenOut.decimals)} {tokenOut.symbol}
            </span>
          </div>
        </div>
      )}

      {/* 滑点设置:设计稿中按钮下方为留白区,滑点设置常驻于此,明显告知用户这里调滑点 */}
      <div className="slippage-settings">
        <span className="settings-label">{t('swap.slippageLabel')}</span>
        <div className="slippage-row">
          <button
            className={isAuto ? 'chip active' : 'chip'}
            onClick={() => {
              setIsAuto(true)
              setSlippage(DEFAULT_SLIPPAGE)
            }}
          >
            {t('swap.slippageAuto')}
          </button>
          {[0.1, 0.5, 1].map((v) => (
            <button
              key={v}
              className={!isAuto && slippage === v ? 'chip active' : 'chip'}
              onClick={() => {
                setIsAuto(false)
                setSlippage(v)
              }}
            >
              {v}%
            </button>
          ))}
          <div className="slippage-input">
            <input
              type="number"
              value={slippage}
              min={0}
              step={0.1}
              onChange={(e) => {
                setIsAuto(false)
                setSlippage(Math.max(0, Number(e.target.value)))
              }}
            />
            <span>%</span>
          </div>
        </div>
      </div>


      <TokenModal
        open={modal !== null}
        onClose={() => setModal(null)}
        exclude={modal === 'in' ? tokenOut.address : tokenIn.address}
        onSelect={(t) => (modal === 'in' ? setTokenIn(t) : setTokenOut(t))}
      />
    </div>
  )
}
