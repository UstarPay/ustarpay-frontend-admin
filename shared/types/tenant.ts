import { BaseEntity, Status } from "./base"

// 租户相关类型
export interface Tenant extends BaseEntity {
  id: string;                     // UUID
  email: string;
  name: string;
  apiKey: string;
  apiSecret?: string;             // 不返回给前端时可省略
  status: number;                 // 1: active, 0: suspended, -1: deleted
  allowedIps: string[];
  webhookUrl?: string;
  webhookSecret?: string;
  lastLoginAt?: string;          // ISO 日期字符串
  lastLoginIp?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  loginCount: number;            // 登录次数
}

export interface TenantFullDetail {
  id: string;
  name: string;
  email: string;
  status: number;
  apiKey: string;
  apiSecret: string;
  allowedIps: string[];
  webhookUrl: string;
  webhookSecret: string;
  hasPassword: boolean;
  hasSecondaryPassword: boolean;
  has2FA: boolean;
  createdAt: string;           // ISO 格式时间字符串
  updatedAt: string;
  lastLoginAt?: string;        // 可为 null
  lastLoginIP?: string;

  subscriptionId: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  subscriptionStatus?: number;
  computedStatus?: string;
  daysRemaining?: number;
  paymentTxHash?: string;

  planId?: string;
  planName?: string;
  planType?: string;
  durationMonths?: number;
  walletLimit?: number;
  currencyLimit?: number;
  priceUsdt?: number;
  rateLimitPerMinute?: number;

  overallStatus: string;
  createdBy: string;
  updatedBy: string;
  loginCount: number;            // 登录次数
}


export interface TenantCreateRequest {
  name: string;             // required, min:2, max:100
  email: string;
  password?: string;        // 租户密码，可选
  status: number;
  allowedIps: string[];
  webhookUrl?: string | null;
  webhookSecret?: string | null;
}

export interface TenantUpdateRequest {
  id: string;               // uuid 格式
  name?: string | null;
  email?: string | null;
  password?: string | null; // 租户密码，可选
  secondaryPassword?: string | null; // 租户二级密码，可选
  oldPassword?: string | null; // 旧密码，可选
  oldSecondaryPassword?: string | null; // 旧二级密码，可选
  allowedIps: string[];
  webhookUrl?: string | null;
  webhookSecret?: string | null;
  status: number;
}

export interface TenantPasswordUpdateRequest {
  id: string;               // uuid 格式
  password: string;         // 新密码
}

// 租户配置类型
export interface TenantConfig {
  id: string
  tenantId: string
  category: string
  key: string
  value: string
  description?: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface TenantConfigHistory {
  id: string
  configId: string
  oldValue: string
  newValue: string
  changedBy: string
  reason?: string
  createdAt: string
}

export interface TwoFactorAuth extends BaseEntity {
  id: string
  tenantId: string
  enabled: boolean
  secret?: string
  backupCodes?: string[]
  issuer?: string
  accountName?: string
}