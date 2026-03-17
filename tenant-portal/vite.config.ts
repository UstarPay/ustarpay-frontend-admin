import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  return {
    base: env.VITE_PUBLIC_BASE_PATH || '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    server: {
      port: 3001,
      host: true,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'antd-vendor': ['antd', '@ant-design/icons'],
            'router-vendor': ['react-router-dom'],
            'query-vendor': ['@tanstack/react-query'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'antd', '@ant-design/icons'],
    },
  }
})