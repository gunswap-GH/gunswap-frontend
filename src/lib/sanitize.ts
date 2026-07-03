// 净化链上读来的代币 symbol/name —— 防钓鱼/伪装。
// 任意 ERC20 的 symbol/name 由部署者控制,可能塞入:
//   - C0/C1 控制字符
//   - 零宽字符(U+200B…U+200F、U+FEFF)→ 伪装成真币(如假 "USDT")
//   - 双向控制(RTL/LTR override / isolate)→ 反转显示文本
//   - 超长字符串 → 撑爆布局
// 这里按码点剥离不可见/危险字符,再折叠空白、截断长度。
function isUnsafe(cp: number): boolean {
  return (
    (cp >= 0x00 && cp <= 0x1f) || // C0 控制
    (cp >= 0x7f && cp <= 0x9f) || // DEL + C1 控制
    (cp >= 0x200b && cp <= 0x200f) || // 零宽 + LRM/RLM
    (cp >= 0x202a && cp <= 0x202e) || // 双向 embedding/override
    (cp >= 0x2066 && cp <= 0x2069) || // 双向 isolate
    cp === 0xfeff // BOM / 零宽不换行空格
  )
}

function strip(s: string): string {
  let out = ''
  for (const ch of s || '') {
    const cp = ch.codePointAt(0)
    if (cp !== undefined && !isUnsafe(cp)) out += ch
  }
  return out.replace(/\s+/g, ' ').trim()
}

export function cleanText(s: string, max = 32): string {
  const v = strip(s)
  return v.length > max ? v.slice(0, max) + '…' : v
}

// 代币符号:更短的上限
export const cleanSym = (s: string): string => cleanText(s, 12)
