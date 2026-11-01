import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { privateDesignPosts } from './scripts/design-posts-plugin.ts'

export default defineConfig({
  root: fileURLToPath(new URL('./design', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  envDir: false,
  plugins: [react(), privateDesignPosts(fileURLToPath(new URL('./.local/design-posts', import.meta.url)))],
  server: {
    host: 'localhost', port: 3001, strictPort: true,
    fs: { deny: ['**/.local/**', '.env', '.env.*', '*.{crt,pem}', '**/.git/**'] },
  },
  build: { outDir: '../dist/design', emptyOutDir: true },
})
