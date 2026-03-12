import { TenantFullDetail } from '@shared/types';
import { api } from './api'
import type { DashboardStats } from './statsService'

// 仪表盘数据类型定义
interface VolumeStats {
  totalVolume: string;
  depositVolume: string;
  withdrawVolume: string;
}

interface TransactionStats {
  coinStats: null;
  failedTransactions: number;
  pendingTransactions: number;
  successTransactions: number;
  totalTransactions: number;
  typeStats: null;
  volumeStats: VolumeStats;
}

interface WalletStats {
  activeWallets: number;
  coinStats: null;
  totalWallets: number;
  typeStats: null;
}

export interface DashboardData {
  transactions: TransactionStats;
  wallets: WalletStats;
  tenant: TenantFullDetail;
}
export interface WidgetConfig {
  id: string
  type: 'chart' | 'stat' | 'table' | 'alert'
  title: string
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number }
  config: Record<string, any>
  enabled: boolean
}

// 仪表盘相关的 API 服务
export const dashboardService = {
  // 获取仪表盘数据
  getDashboard: async (params?: {
    period?: 'today' | 'week' | 'month'
    timezone?: string
  }) => {
    return api.get<DashboardData>('/dashboard', {
      config: { params }
    })
  },

  // 获取仪表盘概览统计
  getDashboardOverview: async () => {
    return api.get<{
      totalWallets: number
      totalBalance: string
      totalTransactions: number
      activeUsers: number
      systemHealth: 'healthy' | 'warning' | 'error'
      lastUpdated: string
    }>('/dashboard/overview')
  },

  // 获取最近交易
  getRecentTransactions: async (params?: {
    limit?: number
    type?: 'deposit' | 'withdrawal' | 'transfer'
  }) => {
    return api.get<Array<{
      id: string
      type: string
      amount: string
      currency: string
      status: string
      createdAt: string
      user?: string
      address?: string
    }>>('/dashboard/recent-transactions', params)
  },

  // 获取系统警报
  getAlerts: async (params?: {
    limit?: number
    type?: 'info' | 'warning' | 'error' | 'success'
    unread_only?: boolean
  }) => {
    return api.get<Array<{
      id: string
      type: string
      title: string
      message: string
      createdAt: string
      isRead: boolean
      severity: number
    }>>('/dashboard/alerts', params)
  },

  // 标记警报为已读
  markAlertAsRead: async (alertId: string) => {
    return api.put<void>(`/dashboard/alerts/${alertId}/read`)
  },

  // 批量标记警报为已读
  markAllAlertsAsRead: async () => {
    return api.put<void>('/dashboard/alerts/read-all')
  },

  // 获取系统状态
  getSystemStatus: async () => {
    return api.get<{
      overall: 'healthy' | 'warning' | 'error'
      services: Array<{
        name: string
        status: 'online' | 'offline' | 'degraded'
        responseTime: number
        uptime: number
        lastCheck: string
      }>
      metrics: {
        cpuUsage: number
        memoryUsage: number
        diskUsage: number
        networkLatency: number
      }
    }>('/dashboard/system-status')
  },

  // 获取快速操作
  getQuickActions: async () => {
    return api.get<Array<{
      id: string
      title: string
      description: string
      icon: string
      url: string
      enabled: boolean
      permissions: string[]
    }>>('/dashboard/quick-actions')
  },

  // 获取仪表盘小部件配置
  getWidgetConfigs: async () => {
    return api.get<WidgetConfig[]>('/dashboard/widgets')
  },

  // 更新小部件配置
  updateWidgetConfig: async (widgetId: string, config: Partial<WidgetConfig>) => {
    return api.put<WidgetConfig>(`/dashboard/widgets/${widgetId}`, config)
  },

  // 重置仪表盘布局
  resetDashboardLayout: async () => {
    return api.post<WidgetConfig[]>('/dashboard/reset-layout')
  },

  // 获取实时数据
  getRealTimeData: async (metrics: string[]) => {
    return api.get<Record<string, any>>('/dashboard/realtime', {
      config: { params: { metrics: metrics.join(',') } }
    })
  },

  // 获取活动日志
  getActivityLog: async (params?: {
    page?: number
    page_size?: number
    type?: string
    user?: string
    start_date?: string
    end_date?: string
  }) => {
    return api.get<{
      items: Array<{
        id: string
        type: string
        action: string
        user: string
        details: string
        ipAddress: string
        userAgent: string
        createdAt: string
      }>
      total: number
      page: number
      pageSize: number
    }>('/dashboard/activity-log', {
      config: { params }
    })
  },

  // 导出仪表盘报告
  exportDashboardReport: async (params?: {
    period?: 'day' | 'week' | 'month'
    format?: 'pdf' | 'excel'
    sections?: string[]
  }) => {
    const filename = `dashboard-report-${Date.now()}.${params?.format || 'pdf'}`
    return api.download('/dashboard/export', filename, {
      config: { params }
    })
  },

  // 获取通知设置
  getNotificationSettings: async () => {
    return api.get<{
      email: boolean
      sms: boolean
      push: boolean
      alertTypes: string[]
      frequency: 'immediate' | 'hourly' | 'daily'
    }>('/dashboard/notification-settings')
  },

  // 更新通知设置
  updateNotificationSettings: async (settings: {
    email?: boolean
    sms?: boolean
    push?: boolean
    alertTypes?: string[]
    frequency?: 'immediate' | 'hourly' | 'daily'
  }) => {
    return api.put<void>('/dashboard/notification-settings', settings)
  },

  // 刷新仪表盘数据
  refreshDashboard: async () => {
    return api.post<{
      refreshed: string[]
      timestamp: string
    }>('/dashboard/refresh')
  },

  // 获取统计信息
  getStats: async () => {
    return api.get<DashboardData>('/dashboard/stats')
  },
}