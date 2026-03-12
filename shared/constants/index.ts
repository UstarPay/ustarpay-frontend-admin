// 共享常量定义

// API 端点常量
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  TENANTS: {
    LIST: '/tenants',
    DETAIL: (id: string) => `/tenants/${id}`,
    CREATE: '/tenants',
    UPDATE: (id: string) => `/tenants/${id}`,
    DELETE: (id: string) => `/tenants/${id}`,
    STATS: (id: string) => `/tenants/${id}/stats`,
    WALLETS: (id: string) => `/tenants/${id}/wallets`,
    USERS: (id: string) => `/tenants/${id}/users`,
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  WALLETS: {
    LIST: '/wallets',
    DETAIL: (id: string) => `/wallets/${id}`,
    CREATE: '/wallets',
    UPDATE: (id: string) => `/wallets/${id}`,
    DELETE: (id: string) => `/wallets/${id}`,
    BALANCE: (id: string) => `/wallets/${id}/balance`,
  },
  TRANSACTIONS: {
    LIST: '/transactions',
    DETAIL: (id: string) => `/transactions/${id}`,
    CREATE: '/transactions',
    UPDATE: (id: string) => `/transactions/${id}`,
    CANCEL: (id: string) => `/transactions/${id}/cancel`,
  },
} as const

// 加密货币配置
export const CRYPTOCURRENCIES = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
    network: 'bitcoin',
    icon: '₿',
    color: '#f7931a',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    network: 'ethereum',
    icon: 'Ξ',
    color: '#627eea',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    network: 'ethereum',
    icon: '₮',
    color: '#26a17b',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    network: 'ethereum',
    icon: '$',
    color: '#2775ca',
  },
  BNB: {
    symbol: 'BNB',
    name: 'Binance Coin',
    decimals: 18,
    network: 'bsc',
    icon: 'B',
    color: '#f3ba2f',
  },
} as const

// 区块链网络配置
export const NETWORKS = {
  BITCOIN: {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    explorerUrl: 'https://blockstream.info',
    rpcUrl: 'https://bitcoin-rpc.com',
    confirmations: 6,
  },
  ETHEREUM: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    confirmations: 12,
  },
  BSC: {
    id: 'bsc',
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    chainId: 56,
    explorerUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    confirmations: 15,
  },
  POLYGON: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com/',
    confirmations: 10,
  },
} as const

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const

// 时间格式
export const DATE_FORMATS = {
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  MONTH: 'YYYY-MM',
  YEAR: 'YYYY',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
} as const

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const

// 状态颜色映射
export const STATUS_COLORS = {
  SUCCESS: '#52c41a',
  WARNING: '#faad14',
  ERROR: '#ff4d4f',
  INFO: '#1890ff',
  PROCESSING: '#722ed1',
  DEFAULT: '#d9d9d9',
} as const

// 权限模块常量
export const PERMISSIONS = {
  DASHBOARD: {
    VIEW: 'dashboard:view',
  },
  TENANT: {
    VIEW: 'tenant:view',
    CREATE: 'tenant:create',
    UPDATE: 'tenant:update',
    DELETE: 'tenant:delete',
    MANAGE_STATUS: 'tenant:manage_status',
  },
  USER: {
    VIEW: 'user:view',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    MANAGE_ROLES: 'user:manage_roles',
  },
  WALLET: {
    VIEW: 'wallet:view',
    CREATE: 'wallet:create',
    UPDATE: 'wallet:update',
    DELETE: 'wallet:delete',
    VIEW_BALANCE: 'wallet:view_balance',
    MANAGE_KEYS: 'wallet:manage_keys',
  },
  TRANSACTION: {
    VIEW: 'transaction:view',
    CREATE: 'transaction:create',
    APPROVE: 'transaction:approve',
    CANCEL: 'transaction:cancel',
    VIEW_DETAILS: 'transaction:view_details',
  },
  SYSTEM: {
    VIEW: 'system:view',
    CONFIGURE: 'system:configure',
    MANAGE_SETTINGS: 'system:manage_settings',
  },
  SECURITY: {
    VIEW: 'security:view',
    CONFIGURE: 'security:configure',
    MANAGE_2FA: 'security:manage_2fa',
    VIEW_LOGS: 'security:view_logs',
  },
  REPORTS: {
    VIEW: 'reports:view',
    EXPORT: 'reports:export',
    CONFIGURE: 'reports:configure',
  },
} as const

// 主题配置
export const THEME_CONFIG = {
  LIGHT: {
    name: 'light',
    colors: {
      primary: '#1890ff',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#262626',
    },
  },
  DARK: {
    name: 'dark',
    colors: {
      primary: '#177ddc',
      success: '#49aa19',
      warning: '#d89614',
      error: '#d32029',
      background: '#141414',
      surface: '#1f1f1f',
      text: '#ffffff',
    },
  },
} as const

// 缓存键常量
export const CACHE_KEYS = {
  USER_PROFILE: 'user-profile',
  TENANT_LIST: 'tenant-list',
  WALLET_BALANCE: 'wallet-balance',
  TRANSACTION_HISTORY: 'transaction-history',
  SYSTEM_SETTINGS: 'system-settings',
} as const

// 本地存储键
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
  USER_PREFERENCES: 'user-preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar-collapsed',
} as const

// 通知类型
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
} as const

// 表单验证规则
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  BITCOIN_ADDRESS: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
  ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
} as const

// WebSocket 事件类型
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  TRANSACTION_UPDATE: 'transaction:update',
  BALANCE_UPDATE: 'balance:update',
  NOTIFICATION: 'notification',
  SYSTEM_ALERT: 'system:alert',
} as const

// 错误码
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

// 默认配置
export const DEFAULTS = {
  LANGUAGE: 'zh-CN',
  TIMEZONE: 'Asia/Shanghai',
  CURRENCY: 'USD',
  DECIMAL_PLACES: 8,
  REFRESH_INTERVAL: 30000, // 30秒
} as const
