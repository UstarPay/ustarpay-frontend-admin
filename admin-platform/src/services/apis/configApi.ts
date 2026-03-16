import { apiClient } from "../apiClient"

export interface TenantConfig {
  id: string
  tenant_id: string
  config_key: string
  name: string
  config_value: string
  description?: string
  created_at: string
  updated_at: string
}

/**
 * 配置API
 */
export const configApi = {
  /**
   * 根据配置键获取配置
   */
  getConfigByKey: async (key: string): Promise<{ data: TenantConfig }> => {
    const response = await apiClient.get<{ data: TenantConfig }>(`/configs/key/${key}`)
    return response.data
  },

  /**
   * 获取所有配置
   */
  getConfigs: async (): Promise<{ data: TenantConfig[] }> => {
    const response = await apiClient.get<{ data: TenantConfig[] }>('/configs')
    return response.data
  },
}
