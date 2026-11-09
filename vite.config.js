import react from '@vitejs/plugin-react'
import { defineConfig, transformWithOxc } from 'vite'

function transformJsxInJavaScript() {
  return {
    name: 'transform-jsx-in-javascript',
    enforce: 'pre',
    async transform(code, id) {
      const filePath = id.split('?')[0]
      if (!filePath.endsWith('.js') || !/[/\\]src[/\\]/.test(filePath)) return null

      const result = await transformWithOxc(code, filePath, {
        lang: 'jsx',
        jsx: { runtime: 'automatic', importSource: 'react' },
      })
      return { code: result.code, map: result.map }
    },
  }
}

export default defineConfig({
  plugins: [transformJsxInJavaScript(), react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
})
