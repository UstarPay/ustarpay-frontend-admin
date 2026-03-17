// 共享类型定义

 
// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 统计相关类型
export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalWallets: number;
  totalTransactions: number;
  totalVolume: string;
  dailyTransactions: number;
  dailyVolume: string;
}

// 租户统计类型
export interface TenantStats {
  totalWallets: number;
  totalTransactions: number;
  totalVolume: string;
  dailyTransactions: number;
  dailyVolume: string;
}

export interface ChartData {
  date: string;
  value: number;
  type?: string;
}

// 系统配置类型
export interface SystemConfig {
  siteName: string;
  siteDescription: string;
  supportedCoins: CoinConfig[];
  securitySettings: SecuritySettings;
  notificationSettings: NotificationSettings;
}

export interface CoinConfig {
  symbol: string;
  name: string;
  decimals: number;
  minConfirmations: number;
  networkFee: string;
  enabled: boolean;
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireTwoFactor: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays: number;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  webhookEnabled: boolean;
  emailTemplates: Record<string, string>;
}

// 基础类型
export * from './base'

// 链相关类型
export * from './chain'

// 货币相关类型
export * from './currency'

// 存款相关类型
export * from './deposit'

// 内部转账相关类型
export * from './internalTransfer'

// 登录日志相关类型
export * from './loginLog'

// 通知相关类型
export * from './notice'

// 权限相关类型
export * from './permission'

// 角色相关类型
export * from './role'

// 租户相关类型
export * from './tenant'

// 租户计划相关类型
export * from './tenantPlan'

// 用户相关类型
export * from './user'

// 钱包相关类型
export * from './wallet'

// 卡商相关类型
export * from './cardMerchant'

// 提现相关类型
export * from './withdrawal'

// 归集相关类型
export * from './collection'

// 交易相关类型
export * from './transaction'