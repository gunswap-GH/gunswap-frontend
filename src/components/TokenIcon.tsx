import bnb from '../assets/token-bnb.svg'
import usdt from '../assets/token-usdt.svg'
import busd from '../assets/token-busd.svg'
import eth from '../assets/token-eth.svg'
import btcb from '../assets/token-btcb.svg'
import usdc from '../assets/token-usdc.svg'

// 设计稿矢量代币图标;未收录的代币用设计稿同款占位样式(青色圆 + 前三位字母)
const ICONS: Record<string, string> = {
  BNB: bnb,
  WBNB: bnb,
  USDT: usdt,
  BUSD: busd,
  ETH: eth,
  WETH: eth,
  BTCB: btcb,
  BTC: btcb,
  USDC: usdc
}

// 按【地址】指定图标,优先级高于符号。用途:让本项目自己的测试稳定币显示成真 USDT 图标,
// 同时与其他同名(同 symbol)代币区分开 —— 别人部署的 mUSDT 是不同地址,不会蹭到这个图标,
// 只会拿到字母占位图,一眼就能分辨哪个是我们的。
const ADDR_ICONS: Record<string, string> = {
  // 需要时在此加 '0x小写地址': 图标资源,即可让某个地址显示指定 logo(优先于符号)。
  // (测试 mUSDT 曾配过 USDT 图标,现已移除,改回默认字母图标)
}

// 解析代币图标 URL:先按地址(覆盖,如我们的 mUSDT→真 USDT),再按符号;都没有返回 undefined。
// 共享给 TokenIcon(池子/兑换)和 TokenModal(选币弹窗),保证两处区分逻辑一致。
export function tokenIconSrc(symbol: string, address?: string): string | undefined {
  return (address && ADDR_ICONS[address.toLowerCase()]) || ICONS[symbol.toUpperCase()]
}

export function TokenIcon({ symbol, address }: { symbol: string; address?: string }) {
  const src = tokenIconSrc(symbol, address)
  if (src) return <img className="pool-token" src={src} alt={symbol} />
  return <span className="pool-token pool-token-fallback">{symbol.slice(0, 3).toUpperCase()}</span>
}
