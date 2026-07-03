import { useMemo } from 'react'
import { marked } from 'marked'
import whitepaper from '../content/GunSwap_whitepaper.md?raw'

// 白皮书站内渲染(原 GitBook 外链被封,改为本地 markdown)
export function DocsPage() {
  const html = useMemo(() => marked.parse(whitepaper, { async: false }) as string, [])
  return (
    <div className="docs-page">
      <article className="docs-article" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
