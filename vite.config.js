import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  build: { target: 'esnext' },
  server: { proxy: { '/api': 'http://localhost:3001' } } // khi dev, chuyển /api sang server Node
})
