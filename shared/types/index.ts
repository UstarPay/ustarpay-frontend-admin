// Shared type definitions

// API response types
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

// Dashboard types
export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalWallets: number;
  totalTransactions: number;
  totalVolume: string;
  dailyTransactions: number;
  dailyVolume: string;
}

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

// System config types
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

export * from "./base";
export * from "./chain";
export * from "./currency";
export * from "./kms";
export * from "./deposit";
export * from "./internalTransfer";
export * from "./loginLog";
export * from "./notice";
export * from "./permission";
export * from "./role";
export * from "./tenant";
export * from "./tenantPlan";
export * from "./user";
export * from "./wallet";
export * from "./cardMerchant";
export * from "./withdrawal";
export * from "./collection";
export * from "./transaction";
export * from "./payment";
export * from "./inviteRebate";
