import { BaseEntity } from "./base"
import { PaginatedResponse, ListParams } from "./index"

// ===========================================
// 租户计划相关类型定义
// ===========================================

// 租户计划信息
export interface TenantPlan {
  id: string                 // 计划ID (UUID)
  name: string              // 计划名称
  type: string              // 计划类型 (standard, enterprise, private)
  durationMonths: number    // 持续月数
  walletLimit?: number      // 钱包数量限制
  currencyLimit?: number    // 货币数量限制
  rateLimitPerMinute?: number  // 每分钟请求速率限制
  priceUSDT: string        // USDT价格 (decimal as string)
  status?: number          // 状态 (-1: 禁用, 0: 草稿, 1: 启用)
  createdAt: string        // 创建时间
  updatedAt: string        // 更新时间
  // 关联信息
  activeSubscriptions?: number // 活跃订阅数（可选）
}

// 租户计划列表查询参数
export interface TenantPlanListParams extends ListParams {
  type?: string            // 计划类型
  status?: number          // 状态
  durationMonths?: number  // 持续月数
  withSubscriptions?: boolean // 是否包含订阅信息
}

// 创建租户计划请求
export interface CreateTenantPlanRequest {
  name: string              // 计划名称
  type: string              // 计划类型 (standard, enterprise, private)
  durationMonths: number    // 持续月数
  walletLimit?: number      // 钱包数量限制
  currencyLimit?: number    // 货币数量限制
  rateLimitPerMinute?: number  // 每分钟请求速率限制
  priceUSDT: string        // USDT价格
}

// 更新租户计划请求
export interface UpdateTenantPlanRequest {
  name?: string             // 计划名称
  walletLimit?: number      // 钱包数量限制
  currencyLimit?: number    // 货币数量限制
  rateLimitPerMinute?: number  // 每分钟请求速率限制
  priceUSDT?: string       // USDT价格
  status?: number          // 状态
}

// ===========================================
// 租户计划订阅相关类型定义
// ===========================================

// 租户基本信息
export interface TenantBasicInfo {
  id: string       // 租户ID
  name: string     // 租户名称
  code: string     // 租户代码
  status: number   // 状态
}

// 租户计划订阅信息
export interface TenantPlanSubscription {
  id: string                    // 订阅ID (UUID)
  tenantId: string             // 租户ID (UUID)
  planId: string               // 计划ID (UUID)
  startAt: string              // 开始时间
  endAt: string                // 结束时间
  status?: number              // 订阅状态
  paymentTxHash?: string       // 支付交易哈希
  createdAt: string            // 创建时间
  updatedAt: string            // 更新时间
  // 关联信息
  tenant?: TenantBasicInfo     // 租户信息（可选）
  plan?: TenantPlan           // 计划信息（可选）
}

// 租户计划订阅列表查询参数
export interface TenantPlanSubscriptionListParams extends ListParams {
  tenantId?: string           // 租户ID
  planId?: string             // 计划ID
  status?: number             // 订阅状态
  startDate?: string          // 开始日期过滤
  endDate?: string            // 结束日期过滤
  withTenant?: boolean        // 是否包含租户信息
  withPlan?: boolean          // 是否包含计划信息
}

// 创建租户计划订阅请求
export interface CreateTenantPlanSubscriptionRequest {
  tenantId: string            // 租户ID
  planId: string              // 计划ID
  startAt: string             // 开始时间
  paymentTxHash?: string      // 支付交易哈希
}

// 更新租户计划订阅请求
export interface UpdateTenantPlanSubscriptionRequest {
  startAt?: string            // 开始时间
  endAt?: string              // 结束时间
  status?: number             // 订阅状态
  paymentTxHash?: string      // 支付交易哈希
}

// ===========================================
// 统计和扩展功能类型
// ===========================================

// 租户计划统计信息
export interface TenantPlanStats {
  planId: string              // 计划ID
  planName: string            // 计划名称
  totalSubscriptions: number  // 总订阅数
  activeSubscriptions: number // 活跃订阅数
  totalRevenue: string        // 总收入 (decimal as string)
}

// 租户活跃订阅信息
export interface TenantActiveSubscription {
  tenantId: string            // 租户ID
  planId: string              // 计划ID
  planName: string            // 计划名称
  planType: string            // 计划类型
  startAt: string             // 开始时间
  endAt: string               // 结束时间
  remainingDays: number       // 剩余天数
}

// 即将过期订阅查询参数
export interface ExpiringSoonSubscriptionsParams {
  days: number                // 过期天数
}

// ===========================================
// 响应类型
// ===========================================

// 租户计划分页响应
export type TenantPlanResponse = PaginatedResponse<TenantPlan>

// 租户计划订阅分页响应
export type TenantPlanSubscriptionResponse = PaginatedResponse<TenantPlanSubscription>

// ===========================================
// 常量定义
// ===========================================

// 计划类型选项
export const TENANT_PLAN_TYPES = [
  { value: 'standard', label: '标准版' },
  { value: 'enterprise', label: '企业版' },
  { value: 'private', label: '私有版' }
] as const

// 状态选项
export const TENANT_PLAN_STATUS_OPTIONS = [
  { value: -1, label: '禁用', color: 'red' },
  { value: 0, label: '草稿', color: 'orange' },
  { value: 1, label: '启用', color: 'green' }
] as const

// 订阅状态选项
export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: -1, label: '已取消', color: 'red' },
  { value: 0, label: '未激活', color: 'orange' },
  { value: 1, label: '已激活', color: 'green' }
] as const 