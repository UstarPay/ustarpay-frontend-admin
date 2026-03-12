/// &lt;reference types="vite/client" /&gt;

interface ImportMetaEnv {
  readonly VITE_ADMIN_PREFIX: string
  readonly VITE_AUTH_PREFIX: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENVIRONMENT: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_DEBUG: string
  // Vite 内置环境变量
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly BASE_URL: string
  readonly SSR: boolean
  // 添加更多你需要的环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
