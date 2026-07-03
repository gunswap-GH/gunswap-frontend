import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { CHAIN } from './config'

type Toast = { id: number; kind: 'info' | 'success' | 'error'; text: string; href?: string }

type ToastApi = {
  info: (text: string) => void
  success: (text: string, txHash?: string) => void
  error: (text: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)
let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((kind: Toast['kind'], text: string, href?: string) => {
    const id = nextId++
    setToasts((t) => [...t, { id, kind, text, href }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 7000)
  }, [])

  const api: ToastApi = {
    info: (text) => push('info', text),
    success: (text, txHash) => push('success', text, txHash ? `${CHAIN.blockExplorer}/tx/${txHash}` : undefined),
    error: (text) => push('error', text)
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <span>{t.text}</span>
            {t.href && (
              <a href={t.href} target="_blank" rel="noreferrer">
                查看 ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

// turn a thrown error into a short human message
export function errMessage(e: any): string {
  if (e?.code === 'ACTION_REJECTED' || e?.code === 4001) return '你取消了交易'
  return e?.shortMessage || e?.reason || e?.message || '交易失败'
}
