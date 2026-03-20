import { apiClient } from '../apiClient'
import type {
  SystemKMSConfig,
  SystemKMSConfigListParams,
  SystemKMSConfigListResponse,
  UpsertSystemKMSConfigRequest,
} from '@shared/types/kms'

export const kmsApi = {
  async getKMSConfigs(params: SystemKMSConfigListParams = {}): Promise<SystemKMSConfigListResponse> {
    const response = await apiClient.get<any>('/kms-configs', { params })
    const payload = response.data || {}
    return {
      items: payload.items || [],
      total: payload.total || 0,
      page: params.page || payload.page || 1,
      pageSize: params.limit || payload.limit || 20,
      totalPages: Math.max(1, Math.ceil((payload.total || 0) / (params.limit || payload.limit || 20))),
      limit: payload.limit || params.limit || 20,
    }
  },

  async getKMSConfig(id: string): Promise<SystemKMSConfig> {
    const response = await apiClient.get<SystemKMSConfig>(`/kms-configs/${id}`)
    return response.data
  },

  async createKMSConfig(data: UpsertSystemKMSConfigRequest): Promise<SystemKMSConfig> {
    const response = await apiClient.post<SystemKMSConfig>('/kms-configs', data)
    return response.data
  },

  async updateKMSConfig(id: string, data: UpsertSystemKMSConfigRequest): Promise<SystemKMSConfig> {
    const response = await apiClient.put<SystemKMSConfig>(`/kms-configs/${id}`, data)
    return response.data
  },

  async deleteKMSConfig(id: string): Promise<void> {
    await apiClient.delete(`/kms-configs/${id}`)
  },
}

export default kmsApi
