import { Navigate, Route, Routes } from 'react-router-dom'
import { WalletProvider } from './wallet'
import { ToastProvider } from './toast'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { BottomNav } from './components/BottomNav'
import { HomePage } from './pages/HomePage'
import { SwapPage } from './pages/SwapPage'
import { LiquidityPage } from './pages/LiquidityPage'
import { AddLiquidityPage } from './pages/AddLiquidityPage'
import { CreatePoolPage } from './pages/CreatePoolPage'
import { DocsPage } from './pages/DocsPage'

export function App() {
  return (
    <WalletProvider>
      <ToastProvider>
        <div className="app">
          <div className="bg-orbs" aria-hidden />
          <Header />
          <main className="main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/swap" element={<SwapPage />} />
              <Route path="/liquidity" element={<LiquidityPage />} />
              <Route path="/liquidity/add" element={<AddLiquidityPage />} />
              <Route path="/liquidity/create" element={<CreatePoolPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <BottomNav />
        </div>
      </ToastProvider>
    </WalletProvider>
  )
}
