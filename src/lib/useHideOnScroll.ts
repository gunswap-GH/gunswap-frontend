import { useEffect, useRef, useState } from 'react'

// 下滑隐藏、上滑出现的滚动检测。
// - 顶部 topOffset 内永远显示
// - 小于 threshold 的抖动忽略,避免闪烁
// - 用 rAF 节流
export function useHideOnScroll(opts: { threshold?: number; topOffset?: number } = {}) {
  const { threshold = 6, topOffset = 64 } = opts
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    lastY.current = window.scrollY

    const update = () => {
      const y = Math.max(0, window.scrollY)
      const diff = y - lastY.current
      if (y <= topOffset) {
        setHidden(false)
      } else if (Math.abs(diff) >= threshold) {
        setHidden(diff > 0) // 向下滚 -> 隐藏;向上滚 -> 显示
      }
      lastY.current = y
      ticking.current = false
    }

    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      window.requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold, topOffset])

  return hidden
}
