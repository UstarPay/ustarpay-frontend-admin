import { apiClient } from "../apiClient"
import { 
  Wallet, 
  TenantStats, 
  Tenant, 
  TenantFullDetail,
  TenantCreateRequest,
  TenantUpdateRequest,
  TenantPasswordUpdateRequest,
  User, 
  PaginatedResponse, 
  ListParams, 
  Status
} from "@shared/types"

/**
 * 租户API
 */
export const tenantApi = {
  /**
   * 获取租户钱包列表
   */
  getWallets: async (tenantId: string): Promise<Wallet[]> => {
    const response = await apiClient.get<Wallet[]>(`/tenants/${tenantId}/wallets`)
    return response.data
  },

  /**获取租户统计 */
  getStats: async (tenantId: string): Promise<TenantStats> => {
    const response = await apiClient.get<TenantStats>(`/tenants/${tenantId}/stats`)
    return response.data
  },

  /**获取租户详情 - 返回完整详情信息 */
  getTenant: async (tenantId: string): Promise<TenantFullDetail> => {
    const response = await apiClient.get<TenantFullDetail>(`/tenants/${tenantId}`)
    return response.data
  },  

  /**获取租户列表 - 返回完整详情信息列表 */
  getTenants: async (params: ListParams): Promise<PaginatedResponse<TenantFullDetail>> => {
    const response = await apiClient.get<PaginatedResponse<TenantFullDetail>>('/tenants', {
      params,
    })
    return response.data
  },

  /**获取租户用户列表 */
  getUsers: async (tenantId: string): Promise<User[]> => {
    const response = await apiClient.get<User[]>(`/tenants/${tenantId}/users`)
    return response.data
  },

  /**更新租户状态 */
  updateStatus: async (id: string, status: Status): Promise<TenantFullDetail> => {
    const response = await apiClient.put<TenantFullDetail>(`/tenants/${id}/status`, { status })
    return response.data
  },

  /**创建租户 */
  createTenant: async (data: TenantCreateRequest): Promise<TenantFullDetail> => {
    const response = await apiClient.post<TenantFullDetail>('/tenants', data, { prefix: apiClient.adminPrefix })
    return response.data
  },

  /**更新租户 */
  updateTenant: async (id: string, data: TenantUpdateRequest): Promise<TenantFullDetail> => {
    const response = await apiClient.put<TenantFullDetail>(`/tenants/${id}`, data)
    return response.data
  },

  /**删除租户 */
  deleteTenant: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenants/${id}`)
  },

  /**重新生成API密钥 */
  regenerateAPICredentials: async (id: string): Promise<TenantFullDetail> => {
    const response = await apiClient.post<TenantFullDetail>(`/tenants/${id}/regenerate`)
    return response.data
  },

  /**更新租户密码 */
  updatePassword: async (id: string, password: string): Promise<void> => {
    await apiClient.put(`/tenants/${id}/password`, { password })
  },
}
 