import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // Base path for GitHub Pages deployment at https://venmail.github.io/avnac-vue/
  // Falls back to '/' for local dev and other hosting environments
  base: process.env.GITHUB_PAGES === 'true' ? '/avnac-vue/' : '/',
  resolve: {
    alias: {
      '#': resolve(__dirname, 'src'),
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
