import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // 把最重的钱包栈 / ethers 拆成独立 chunk:可并行下载,且跨版本部署时
        // 业务代码改动不会让这些大依赖的缓存失效。
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@reown') || id.includes('walletconnect')) return 'vendor-wallet'
            if (id.includes('ethers')) return 'vendor-ethers'
          }
        }
      }
    }
  }
})
