import { api } from './api'
import type {
  CreateCollectionConfigRequest,
  UpdateCollectionConfigRequest,
  CollectionConfigQueryParams,
  CollectionTaskQueryParams,
  ManualCollectionRequest,
  CollectionConfigResponse,
  RunningTasksResponse,
  CollectionConfigStatsResponse,
  CollectionTaskStatsResponse,
  CollectionSchedulerStatsResponse,
  ManualCollectionResponse,
  CollectionHistoryRecord,
  TenantCollectionConfig
} from '@shared/types'

const BASE_URL = '/collection'

export const collectionService = {
  // 配置管理
  // 创建自动归集配置
  createConfig: async (data: CreateCollectionConfigRequest): Promise<CollectionConfigResponse> => {
    const response = await api.post(`${BASE_URL}/configs`, data)
    return response.data
  },

  // 获取配置列表
  getConfigs: async (params: CollectionConfigQueryParams) => {
    return api.getPaginated<TenantCollectionConfig>(`${BASE_URL}/configs`, params)
  },

  // 获取单个配置
  getConfig: async (id: string): Promise<CollectionConfigResponse> => {
    const response = await api.get(`${BASE_URL}/configs/${id}`)
    return response.data
  },

  // 更新配置
  updateConfig: async (id: string, data: UpdateCollectionConfigRequest): Promise<{ message: string }> => {
    const response = await api.put(`${BASE_URL}/configs/${id}`, data)
    return response.data
  },

  // 删除配置
  deleteConfig: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`${BASE_URL}/configs/${id}`)
    return response.data
  },

  // 任务管理
  // 获取任务列表
  getTasks: async (params: CollectionTaskQueryParams) => {
    return api.getPaginated<TenantCollectionTask>(`${BASE_URL}/tasks`, params)
  },

  // 获取待执行任务（/tasks/running 默认 status=1）
  getRunningTasks: async (): Promise<RunningTasksResponse> => {
    const res = await api.get<RunningTasksResponse>(`${BASE_URL}/tasks/running`)
    return res as unknown as RunningTasksResponse
  },

  // 执行控制
  // 立即执行归集（configId 为 UUID 字符串）
  executeCollection: async (configId: string): Promise<{ data?: unknown; success: boolean; message?: string; code?: string }> => {
    // 返回完整响应以便前端根据 code 正确展示 message（需包含 code/message，不能只返回 response.data）
    const response = await api.post(`${BASE_URL}/configs/${configId}/execute`)
    return response as unknown as { data?: unknown; success: boolean; message?: string; code?: string }
  },

  // 手动触发归集
  manualCollection: async (request: ManualCollectionRequest): Promise<ManualCollectionResponse> => {
    const response = await api.post(`${BASE_URL}/manual`, request)
    return response.data
  },

  // 统计监控
  // 配置统计
  getConfigStats: async (): Promise<CollectionConfigStatsResponse> => {
    const response = await api.get(`${BASE_URL}/configs/stats`)
    return response.data
  },

  // 任务统计（后端返回 { data: stats, success }，此处保持 { data } 供页面 taskStats.data 使用）
  getTaskStats: async (params: { startDate?: string; endDate?: string }): Promise<CollectionTaskStatsResponse> => {
    const response = await api.get(`${BASE_URL}/tasks/stats`, params)
    return { data: response.data as CollectionTaskStatsResponse['data'] }
  },

  // 调度器统计
  getSchedulerStats: async (): Promise<CollectionSchedulerStatsResponse> => {
    const response = await api.get(`${BASE_URL}/scheduler/stats`)
    return response.data
  },

  // 归集历史
  getHistory: async (params: { startDate?: string; endDate?: string; page?: number; pageSize?: number }) => {
    return api.getPaginated<CollectionHistoryRecord>(`${BASE_URL}/history`, params)
  }
}
