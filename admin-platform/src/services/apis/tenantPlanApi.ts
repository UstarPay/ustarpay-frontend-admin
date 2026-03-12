import { apiClient } from '../apiClient'
import { 
  TenantPlan,
  TenantPlanListParams,
  CreateTenantPlanRequest,
  UpdateTenantPlanRequest,
  TenantPlanResponse,
  TenantPlanSubscription,
  TenantPlanSubscriptionListParams,
  CreateTenantPlanSubscriptionRequest,
  UpdateTenantPlanSubscriptionRequest,
  TenantPlanSubscriptionResponse,
  TenantPlanStats,
  TenantActiveSubscription,
  ExpiringSoonSubscriptionsParams
} from '@shared/types/tenantPlan'

// =================== 租户计划管理API ===================

export const tenantPlanApi = {
  /**
   * 获取租户计划列表
   */
  async getTenantPlans(params: TenantPlanListParams = { page: 1, pageSize: 10 }): Promise<TenantPlanResponse> {
    const response = await apiClient.get<TenantPlanResponse>('/tenant-plans', { params })
    return response.data
  },

  /**
   * 创建租户计划
   */
  async createTenantPlan(data: CreateTenantPlanRequest): Promise<TenantPlan> {
    const response = await apiClient.post<TenantPlan>('/tenant-plans', data)
    return response.data
  },

  /**
   * 获取租户计划详情
   */
  async getTenantPlanById(id: string): Promise<TenantPlan> {
    const response = await apiClient.get<TenantPlan>(`/tenant-plans/${id}`)
    return response.data
  },

  /**
   * 更新租户计划
   */
  async updateTenantPlan(id: string, data: UpdateTenantPlanRequest): Promise<TenantPlan> {
    const response = await apiClient.put<TenantPlan>(`/tenant-plans/${id}`, data)
    return response.data
  },

  /**
   * 删除租户计划
   */
  async deleteTenantPlan(id: string): Promise<void> {
    await apiClient.delete(`/tenant-plans/${id}`)
  }
}

// =================== 租户计划订阅管理API ===================

export const tenantPlanSubscriptionApi = {
  /**
   * 获取租户计划订阅列表
   */
  async getTenantPlanSubscriptions(params: TenantPlanSubscriptionListParams = { page: 1, pageSize: 10 }): Promise<TenantPlanSubscriptionResponse> {
    const response = await apiClient.get<TenantPlanSubscriptionResponse>('/tenant-plan-subscriptions', { params })
    return response.data
  },

  /**
   * 创建租户计划订阅
   */
  async createTenantPlanSubscription(data: CreateTenantPlanSubscriptionRequest): Promise<TenantPlanSubscription> {
    const response = await apiClient.post<TenantPlanSubscription>('/tenant-plan-subscriptions', data)
    return response.data
  },

  /**
   * 获取租户计划订阅详情
   */
  async getTenantPlanSubscriptionById(id: string): Promise<TenantPlanSubscription> {
    const response = await apiClient.get<TenantPlanSubscription>(`/tenant-plan-subscriptions/${id}`)
    return response.data
  },

  /**
   * 更新租户计划订阅
   */
  async updateTenantPlanSubscription(id: string, data: UpdateTenantPlanSubscriptionRequest): Promise<TenantPlanSubscription> {
    const response = await apiClient.put<TenantPlanSubscription>(`/tenant-plan-subscriptions/${id}`, data)
    return response.data
  },

  /**
   * 取消租户计划订阅
   */
  async cancelTenantPlanSubscription(id: string): Promise<TenantPlanSubscription> {
    const response = await apiClient.patch<TenantPlanSubscription>(`/tenant-plan-subscriptions/${id}/cancel`)
    return response.data
  },

  /**
   * 删除租户计划订阅
   */
  async deleteTenantPlanSubscription(id: string): Promise<void> {
    await apiClient.delete(`/tenant-plan-subscriptions/${id}`)
  }
}

// =================== 统计和扩展功能API ===================

export const tenantPlanStatsApi = {
  /**
   * 获取租户计划统计信息
   */
  async getTenantPlanStats(): Promise<TenantPlanStats[]> {
    const response = await apiClient.get<TenantPlanStats[]>('/tenant-plans/stats')
    return response.data
  },

  /**
   * 获取即将过期的订阅
   */
  async getExpiringSoonSubscriptions(params: ExpiringSoonSubscriptionsParams): Promise<TenantActiveSubscription[]> {
    const response = await apiClient.get<TenantActiveSubscription[]>('/tenant-plan-subscriptions/expiring-soon', { params })
    return response.data
  },

  /**
   * 获取租户活跃订阅
   */
  async getTenantActiveSubscriptions(): Promise<TenantActiveSubscription[]> {
    const response = await apiClient.get<TenantActiveSubscription[]>('/tenant-plan-subscriptions/active')
    return response.data
  }
}

// =================== 组合API ===================

export const tenantPlanService = {
  plan: tenantPlanApi,
  subscription: tenantPlanSubscriptionApi,
  stats: tenantPlanStatsApi
}

export default tenantPlanService 