import { Link } from 'react-router-dom'

// 面包屑导航:一级/二级菜单。带 `to` 的项可点击(返回上一级),
// 最后一项为当前页(不可点)。可复用于任意子页面。
export type Crumb = { label: string; to?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {items.map((c, i) => {
        const isLast = i === items.length - 1
        return (
          <span className="crumb-item" key={i}>
            {c.to && !isLast ? (
              <Link className="crumb-link" to={c.to}>
                {c.label}
              </Link>
            ) : (
              <span className="crumb-current" aria-current={isLast ? 'page' : undefined}>
                {c.label}
              </span>
            )}
            {!isLast && <span className="crumb-sep">/</span>}
          </span>
        )
      })}
    </nav>
  )
}
