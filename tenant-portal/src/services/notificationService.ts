import { api } from './api'
import type { Notification, NotificationQueryParams, NotificationStats } from '@shared/types'

// 通知相关的 API 服务
export const notificationService = {
  // 获取通知列表
  getNotifications: async (params?: NotificationQueryParams) => {
    return api.getPaginated<Notification>('/notifications', params)
  },

  // 获取通知详情
  getNotification: async (id: string) => {
    return api.get<Notification>(`/notifications/${id}`)
  },

  // 标记通知为已读
  markAsRead: async (id: string) => {
    return api.patch<void>(`/notifications/${id}/read`)
  },

  // 批量标记为已读
  markMultipleAsRead: async (ids: string[]) => {
    return api.patch<void>('/notifications/batch-read', { ids })
  },

  // 删除通知
  deleteNotification: async (id: string) => {
    return api.delete<void>(`/notifications/${id}`)
  },

  // 批量删除通知
  deleteMultipleNotifications: async (ids: string[]) => {
    return api.delete<void>(`/notifications/batch-delete?ids=${ids.join(',')}`)
  },

  // 获取通知统计
  getNotificationStats: async () => {
    return api.get<NotificationStats>('/notifications/stats')
  },

  // 获取通知设置
  getNotificationSettings: async () => {
    return api.get<{
      emailEnabled: boolean
      smsEnabled: boolean
      webhookEnabled: boolean
      pushEnabled: boolean
      notificationTypes: Record<string, boolean>
      quietHours: {
        enabled: boolean
        startTime: string
        endTime: string
      }
    }>('/notifications/settings')
  },

  // 更新通知设置
  updateNotificationSettings: async (settings: {
    emailEnabled?: boolean
    smsEnabled?: boolean
    webhookEnabled?: boolean
    pushEnabled?: boolean
    notificationTypes?: Record<string, boolean>
    quietHours?: {
      enabled: boolean
      startTime: string
      endTime: string
    }
  }) => {
    return api.put<void>('/notifications/settings', settings)
  },

  // 测试通知
  testNotification: async (type: 'email' | 'sms' | 'webhook' | 'push') => {
    return api.post<void>(`/notifications/test/${type}`)
  },
} 