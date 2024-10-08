import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'
import { compression } from 'vite-plugin-compression2'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), topLevelAwait(), wasm(), compression(), nodePolyfills()],
  resolve: {
    alias: {
      '@components': '/src/components',
      '@containers': '/src/containers',
      '@pages': '/src/pages',
      '@static': '/src/static',
      '@store': '/src/store',
      '@web3': '/src/web3',
      '@utils': '/src/utils',
      '@/': '/src'
    }
  },
  server: {
    host: 'localhost',
    port: 3000
  },
  build: {
    rollupOptions: {
      external: ['fs/promises', 'path']
    }
  },
  define: {
    'process.env.ALEPHIUM_CONTRACT_DEBUG_MESSAGE': false,
    'process.browser': `"test"`,
    'process.version': `"test"`
  }
})
