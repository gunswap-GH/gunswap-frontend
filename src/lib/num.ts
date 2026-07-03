// 数字/金额格式化(展示用)
export const fmtUsd = (n: number) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(2)}B`
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(2)}M`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(1)}K`
        : `$${n.toFixed(2)}`

// 前端统一对外固定显示 0.30%(不暴露各池真实费率)。
// 注意:这只是 UI 文案;链上实际按各池真实费率扣费,swap 报价(getAmountsOut)仍是真实的。
export const fmtFee = (_bps: number) => '0.30%'
