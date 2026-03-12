import { api } from './api'

// API日志相关的 API 服务
export const logService = {
  // 获取API日志列表
  getApiLogs: async (params?: {
    page?: number
    pageSize?: number
    method?: string
    statusCode?: number
    path?: string
    userId?: string
    ipAddress?: string
    dateRange?: string[]
  }) => {
    return api.getPaginated<any>('/api-logs', params)
  },

  // 获取API日志统计
  getApiLogStats: async () => {
    return api.get<any>('/api-logs/stats')
  },

  // 搜索API日志
  searchApiLogs: async (params: {
    method?: string
    statusCode?: number
    path?: string
    userId?: string
    ipAddress?: string
    dateRange?: string[]
  }) => {
    return api.getPaginated<any>('/api-logs/search', params)
  },

  // 清理API日志
  clearApiLogs: async () => {
    return api.delete<void>('/api-logs/clear')
  },

  // 获取Webhook日志列表
  getWebhookLogs: async (params?: {
    page?: number
    pageSize?: number
    eventType?: string
    status?: string
    webhookId?: string
    dateRange?: string[]
  }) => {
    return api.getPaginated<any>('/webhook-logs', params)
  },

  // 获取Webhook日志统计
  getWebhookLogStats: async () => {
    return api.get<any>('/webhook-logs/stats')
  },

  // 搜索Webhook日志
  searchWebhookLogs: async (params: {
    eventType?: string
    status?: string
    webhookId?: string
    dateRange?: string[]
  }) => {
    return api.getPaginated<any>('/webhook-logs/search', params)
  },

  // 清理Webhook日志
  clearWebhookLogs: async () => {
    return api.delete<void>('/webhook-logs/clear')
  },

  // 重试Webhook发送
  retryWebhook: async (logId: string) => {
    return api.post<any>(`/webhook-logs/${logId}/retry`)
  },

  // 获取系统日志
  getSystemLogs: async (params?: {
    page?: number
    pageSize?: number
    level?: string
    module?: string
    dateRange?: string[]
  }) => {
    return api.getPaginated<any>('/system-logs', params)
  },

  // 获取系统日志统计
  getSystemLogStats: async () => {
    return api.get<any>('/system-logs/stats')
  },

  // 搜索系统日志
  searchSystemLogs: async (params: {
    level?: string
    module?: string
    dateRange?: string[]
  }) => {
    return api.getPaginated<any>('/system-logs/search', params)
  },

  // 清理系统日志
  clearSystemLogs: async () => {
    return api.delete<void>('/system-logs/clear')
  }
} 