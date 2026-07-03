import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { MaxUint256 } from 'ethers'
import { CHAIN, DEFAULT_DEADLINE_MINUTES } from '../config'
import { ERC20_ABI, PAIR_ABI, ROUTER_ABI } from '../abis'
import { confirmTx, fmt, readContract, toUnits, writeContract } from '../lib/eth'
import { useWallet } from '../wallet'
import { errMessage, useToast } from '../toast'

// 弹窗需要的最小池子信息(reserves 弹窗自己读链,不依赖外部传)
export type LiquidityPool = {
  address: string
  token0: { address: string; symbol: string; decimals: number }
  token1: { address: string; symbol: string; decimals: number }
  feeBps: number
}

// 列表内「就地加/减流动性」弹窗 —— 针对一个【已存在的池】(代币对固定,无需选币)。
// 纯 V2:同质化 LP,无区间。pool 的 token0/token1 即链上 token0/token1。
export function LiquidityModal({ pool, mode: initMode, onClose, onDone }: {
  pool: LiquidityPool
  mode: 'add' | 'remove'
  onClose: () => void
  onDone?: () => void
}) {
  const { account, wrongNetwork, connect, switchNetwork } = useWallet()
  const toast = useToast()

  const A = pool.token0, B = pool.token1
  const [mode, setMode] = useState<'add' | 'remove'>(initMode)
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [percent, setPercent] = useState(50)
  const [removeMode, setRemoveMode] = useState<'percent' | 'amount'>('percent')
  const [lpInput, setLpInput] = useState('')
  const [slip, setSlip] = useState('0.5')
  const [busy, setBusy] = useState(false)

  const [reserves, setReserves] = useState<{ a: bigint; b: bigint } | null>(null)
  const [lpBalance, setLpBalance] = useState<bigint>(0n)
  const [lpTotal, setLpTotal] = useState<bigint>(0n)
  const [balA, setBalA] = useState<bigint>(0n)
  const [balB, setBalB] = useState<bigint>(0n)

  const amountAWei = useMemo(() => toUnits(amountA, A.decimals), [amountA, A])
  const amountBWei = useMemo(() => toUnits(amountB, B.decimals), [amountB, B])
  const slipBps = Math.min(Math.max(Math.round(Number(slip || '0') * 100), 0), 5000) // 0..50%
  const withTol = (v: bigint) => (v * BigInt(10000 - slipBps)) / 10000n

  async function load() {
    try {
      const pair = readContract(pool.address, PAIR_ABI)
      const [r, total] = await Promise.all([pair.getReserves(), pair.totalSupply()])
      setReserves({ a: r[0], b: r[1] }) // token0=A, token1=B
      setLpTotal(total)
      if (account) {
        const [lp, ba, bb] = await Promise.all([
          pair.balanceOf(account),
          readContract(A.address, ERC20_ABI).balanceOf(account),
          readContract(B.address, ERC20_ABI).balanceOf(account)
        ])
        setLpBalance(lp); setBalA(ba); setBalB(bb)
      }
    } catch { /* ignore */ }
  }
  useEffect(() => { load().catch(() => {}) /* eslint-disable-next-line */ }, [account])

  // 加流动性时按池子比例自动补 B
  useEffect(() => {
    if (mode !== 'add' || !reserves || reserves.a <= 0n || amountAWei <= 0n) return
    setAmountB(fmt((amountAWei * reserves.b) / reserves.a, B.decimals, 8))
    // eslint-disable-next-line
  }, [amountAWei, reserves, mode])

  // 返回 false 表示授权超时未确认(多签较慢)——调用方应停下、提示稍后重试。
  async function ensureApproved(token: string, sym: string, amount: bigint, spender: string): Promise<boolean> {
    if (amount <= 0n) return true
    const cur: bigint = await readContract(token, ERC20_ABI).allowance(account, spender)
    if (cur >= amount) return true
    const tx = await (await writeContract(token, ERC20_ABI)).approve(spender, MaxUint256)
    toast.info(`授权 ${sym}…`)
    const st = await confirmTx(tx, {
      check: async () => (await readContract(token, ERC20_ABI).allowance(account, spender)) >= amount
    })
    if (st === 'pending') {
      toast.info(`${sym} 授权已提交。多签确认后请重新点击。`)
      return false
    }
    toast.success(`${sym} 已授权`, tx.hash)
    return true
  }

  async function addLiquidity() {
    if (!account) return
    setBusy(true)
    try {
      const deadline = Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_MINUTES * 60
      if (!(await ensureApproved(A.address, A.symbol, amountAWei, CHAIN.router))) return
      if (!(await ensureApproved(B.address, B.symbol, amountBWei, CHAIN.router))) return
      const router = await writeContract(CHAIN.router, ROUTER_ABI)
      const tx = await router.addLiquidity(
        A.address, B.address, amountAWei, amountBWei,
        withTol(amountAWei), withTol(amountBWei), account, deadline
      )
      toast.info('添加中…')
      const priorLp = lpBalance
      const added = await confirmTx(tx, {
        check: async () => (await readContract(pool.address, PAIR_ABI).balanceOf(account)) > priorLp
      })
      if (added === 'confirmed') toast.success('已添加流动性', tx.hash)
      else toast.info('交易已提交。多签确认较慢或需更多签名;链上确认后请手动刷新查看。')
      setAmountA(''); setAmountB('')
      await load(); onDone?.()
    } catch (e) { toast.error(errMessage(e)) } finally { setBusy(false) }
  }

  async function removeLiquidity() {
    if (!account) return
    setBusy(true)
    try {
      const deadline = Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_MINUTES * 60
      const lpWei = toUnits(lpInput, 18)
      const liquidity = removeMode === 'amount'
        ? (lpWei > lpBalance ? lpBalance : lpWei)
        : (lpBalance * BigInt(percent)) / 100n
      if (liquidity <= 0n) { toast.error('没有 LP 可移除'); return }
      const allowance: bigint = await readContract(pool.address, PAIR_ABI).allowance(account, CHAIN.router)
      if (allowance < liquidity) {
        const atx = await (await writeContract(pool.address, PAIR_ABI)).approve(CHAIN.router, MaxUint256)
        toast.info('授权 LP…')
        const ast = await confirmTx(atx, {
          check: async () => (await readContract(pool.address, PAIR_ABI).allowance(account, CHAIN.router)) >= liquidity
        })
        if (ast === 'pending') {
          toast.info('LP 授权已提交。多签确认后请重新点击「移除流动性」。')
          return
        }
      }
      const expA = reserves && lpTotal > 0n ? (reserves.a * liquidity) / lpTotal : 0n
      const expB = reserves && lpTotal > 0n ? (reserves.b * liquidity) / lpTotal : 0n
      const router = await writeContract(CHAIN.router, ROUTER_ABI)
      const tx = await router.removeLiquidity(
        A.address, B.address, liquidity, withTol(expA), withTol(expB), account, deadline
      )
      toast.info('移除中…')
      const priorLp = lpBalance
      const removed = await confirmTx(tx, {
        check: async () => (await readContract(pool.address, PAIR_ABI).balanceOf(account)) < priorLp
      })
      if (removed === 'confirmed') toast.success('已移除流动性', tx.hash)
      else toast.info('交易已提交。多签确认较慢或需更多签名;链上确认后请手动刷新查看。')
      await load(); onDone?.()
    } catch (e) { toast.error(errMessage(e)) } finally { setBusy(false) }
  }

  const lpInputWei = toUnits(lpInput, 18)
  const removeLp = removeMode === 'amount'
    ? (lpInputWei > lpBalance ? lpBalance : lpInputWei)
    : (lpBalance * BigInt(percent)) / 100n
  const outA = reserves && lpTotal > 0n ? (reserves.a * removeLp) / lpTotal : 0n
  const outB = reserves && lpTotal > 0n ? (reserves.b * removeLp) / lpTotal : 0n

  const action = (() => {
    if (!account) return { label: '连接钱包', onClick: connect, disabled: false }
    if (wrongNetwork) return { label: `切换到 ${CHAIN.name}`, onClick: switchNetwork, disabled: false }
    if (mode === 'add') {
      if (amountAWei <= 0n || amountBWei <= 0n) return { label: '输入数量', onClick: () => {}, disabled: true }
      if (amountAWei > balA || amountBWei > balB) return { label: '余额不足', onClick: () => {}, disabled: true }
      return { label: busy ? '处理中…' : '添加流动性', onClick: addLiquidity, disabled: busy }
    }
    if (lpBalance <= 0n) return { label: '你在此池没有 LP', onClick: () => {}, disabled: true }
    if (removeLp <= 0n) return { label: '输入移除数量', onClick: () => {}, disabled: true }
    return { label: busy ? '处理中…' : '移除流动性', onClick: removeLiquidity, disabled: busy }
  })()

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{A.symbol} / {B.symbol} · {(pool.feeBps / 100).toFixed(2)}%</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="seg" style={{ marginBottom: 12 }}>
          <button className={mode === 'add' ? 'seg-btn active' : 'seg-btn'} onClick={() => setMode('add')}>添加</button>
          <button className={mode === 'remove' ? 'seg-btn active' : 'seg-btn'} onClick={() => setMode('remove')}>移除</button>
        </div>

        {mode === 'add' ? (
          <>
            <div className="swap-box">
              <div className="swap-box-top">
                <span>{A.symbol}</span>
                {account && <span className="balance">余额 {fmt(balA, A.decimals)} <button className="max-btn" onClick={() => setAmountA(fmt(balA, A.decimals, 8))}>MAX</button></span>}
              </div>
              <input className="amount-input full" placeholder="0.0" inputMode="decimal" value={amountA}
                onChange={(e) => setAmountA(e.target.value.replace(/[^0-9.]/g, ''))} />
            </div>
            <div className="swap-box">
              <div className="swap-box-top">
                <span>{B.symbol}</span>
                {account && <span className="balance">余额 {fmt(balB, B.decimals)}</span>}
              </div>
              <input className="amount-input full" placeholder="0.0" inputMode="decimal" value={amountB}
                onChange={(e) => setAmountB(e.target.value.replace(/[^0-9.]/g, ''))} />
            </div>
            <div className="hint">按当前池子比例自动配比;按比例多余的部分会退回。</div>
          </>
        ) : (
          <div className="remove-box">
            <div className="seg" style={{ marginBottom: 12 }}>
              <button className={removeMode === 'percent' ? 'seg-btn active' : 'seg-btn'} onClick={() => setRemoveMode('percent')}>百分比</button>
              <button className={removeMode === 'amount' ? 'seg-btn active' : 'seg-btn'} onClick={() => setRemoveMode('amount')}>输入数量</button>
            </div>

            {removeMode === 'percent' ? (
              <>
                <div className="percent-big">{percent}%</div>
                <input type="range" min={1} max={100} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="slider" />
                <div className="percent-chips">
                  {[25, 50, 75, 100].map((pp) => (
                    <button key={pp} className={percent === pp ? 'chip active' : 'chip'} onClick={() => setPercent(pp)}>{pp}%</button>
                  ))}
                </div>
              </>
            ) : (
              <div className="swap-box">
                <div className="swap-box-top">
                  <span>移除 LP 数量</span>
                  {account && <span className="balance">你的 LP {fmt(lpBalance, 18)} <button className="max-btn" onClick={() => setLpInput(fmt(lpBalance, 18, 8))}>MAX</button></span>}
                </div>
                <input className="amount-input full" placeholder="0.0" inputMode="decimal" value={lpInput}
                  onChange={(e) => setLpInput(e.target.value.replace(/[^0-9.]/g, ''))} />
              </div>
            )}

            <div className="quote-info">
              <div><span>预计取回</span><span>{fmt(outA, A.decimals)} {A.symbol}</span></div>
              <div><span></span><span>{fmt(outB, B.decimals)} {B.symbol}</span></div>
            </div>
          </div>
        )}

        <div className="slip-ctl">
          <span className="slip-label">滑点上限</span>
          <div className="slip-opts">
            {['0.1', '0.5', '1'].map((v) => (
              <button key={v} className={slip === v ? 'slip-chip active' : 'slip-chip'} onClick={() => setSlip(v)}>{v}%</button>
            ))}
            <span className="slip-custom">
              <input inputMode="decimal" value={slip} placeholder="自定义"
                onChange={(e) => setSlip(e.target.value.replace(/[^0-9.]/g, ''))} />%
            </span>
          </div>
        </div>

        <button className="btn btn-primary btn-block btn-action" onClick={action.onClick} disabled={action.disabled}>
          {action.label}
        </button>
      </div>
    </div>,
    document.body
  )
}
