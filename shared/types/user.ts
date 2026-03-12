import { BaseEntity, Status } from "./base"
import { Permission } from "./permission"

// 用户相关类型 - 基于Go后端AdminUserDetail模型
export interface User {
  avatar: string
  id: number
  userName: string
  email: string
  fullName: string
  role: string
  status: Status
  isSuperAdmin: boolean
  lastLoginAt?: string
  lastLoginIp?: string
  loginCount: number
  passwordChangedAt?: string
  createdAt: string
  updatedAt: string
  roleNames: string // 逗号分隔的角色名
  permissionCount: number // 权限数量
  tenantId?: string
  name?: string
}

// 用户列表响应类型
export interface UserList {
  items: User[]
  total: number
  page: number
  pageSize: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  features: string[]
  maxWallets: number
  maxAddresses: number
  maxTransactions: number
}

// 表单相关类型
export interface LoginForm {
  username: string
  password: string
  remember: boolean
  userType: string // platform | tenant
}

export interface LoginResponse {
  token: string
  user: User
  permissions: Permission[]
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
  inviteCode?: string
}

export interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface PasswordResetForm {
  email: string
}

export interface PasswordChangeForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// 两步验证相关类型
export interface TwoFactorSetupResponse {
  qrCode: string
  secret: string
  backupCodes: string[]
}

export interface TwoFactorVerifyForm {
  code: string
}

// 登录会话类型
export interface LoginSession {
  id: string
  userId: string
  sessionId: string
  ipAddress: string
  userAgent: string
  location?: string
  deviceInfo?: string
  isActive: boolean
  lastActivity: string
  createdAt: string
  expiresAt: string
}

// 安全日志类型
export interface SecurityLog {
  id: string
  userId: string
  type: SecurityLogType
  action: string
  description: string
  ipAddress: string
  userAgent: string
  location?: string
  success: boolean
  metadata?: Record<string, any>
  createdAt: string
}

export enum SecurityLogType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR_ENABLE = '2fa_enable',
  TWO_FACTOR_DISABLE = '2fa_disable',
  API_KEY_CREATE = 'api_key_create',
  API_KEY_DELETE = 'api_key_delete',
  SETTINGS_UPDATE = 'settings_update',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

// API密钥类型
export interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  status: APIKeyStatus
  lastUsed?: string
  expiresAt?: string
  createdAt: string
  createdBy: string
}

export enum APIKeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export interface CreateAPIKeyRequest {
  name: string
  permissions: string[]
  expiresAt?: string
}

export interface UpdateAPIKeyRequest {
  name?: string
  permissions?: string[]
  status?: APIKeyStatus
  expiresAt?: string
}