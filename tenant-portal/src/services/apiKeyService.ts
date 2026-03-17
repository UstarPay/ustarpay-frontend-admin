import type {
    PaginatedResponse
} from '@shared/types'
import { api } from './api'

// API密钥类型定义
export interface APIKey {
  id: string
  name: string
  key: string
  secret?: string
  permissions: string[]
  status: 'active' | 'inactive' | 'expired'
  lastUsed?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAPIKeyRequest {
  name: string
  permissions: string[]
  expiresAt?: string
  description?: string
}

export interface UpdateAPIKeyRequest {
  name?: string
  permissions?: string[]
  status?: 'active' | 'inactive'
  description?: string
}

// API密钥相关的 API 服务
export const apiKeyService = {
  // 获取API密钥列表
  getAPIKeys: async (params?: {
    page?: number
    page_size?: number
    search?: string
    status?: string
  }) => {
    return api.get<PaginatedResponse<APIKey>>('/api-keys', {
      config: { params }
    })
  },

  // 获取API密钥详情
  getAPIKey: async (id: string) => {
    return api.get<APIKey>(`/api-keys/${id}`)
  },

  // 创建API密钥
  createAPIKey: async (data: CreateAPIKeyRequest) => {
    return api.post<APIKey>('/api-keys', data)
  },

  // 更新API密钥
  updateAPIKey: async (id: string, data: UpdateAPIKeyRequest) => {
    return api.put<APIKey>(`/api-keys/${id}`, data)
  },

  // 删除API密钥
  deleteAPIKey: async (id: string) => {
    return api.delete<void>(`/api-keys/${id}`)
  },

  // 重新生成API密钥
  regenerateAPIKey: async (id: string) => {
    return api.post<APIKey>(`/api-keys/${id}/regenerate`)
  },

  // 获取API密钥使用统计
  getAPIKeyStats: async (id: string, params?: {
    start_date?: string
    end_date?: string
  }) => {
    return api.get<{
      totalRequests: number
      successRequests: number
      failedRequests: number
      lastUsed: string
      dailyStats: Array<{
        date: string
        requests: number
        success: number
        failed: number
      }>
    }>(`/api-keys/${id}/stats`, {
      config: { params }
    })
  },

  // 获取可用权限列表
  getAvailablePermissions: async () => {
    return api.get<Array<{
      key: string
      name: string
      description: string
      category: string
    }>>('/api-keys/permissions')
  },

  // 测试API密钥
  testAPIKey: async (id: string) => {
    return api.post<{
      valid: boolean
      message: string
      lastTested: string
    }>(`/api-keys/${id}/test`)
  },
}