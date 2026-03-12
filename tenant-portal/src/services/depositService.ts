import type {
    Deposit,
    PaginatedResponse
} from '@shared/types'
import { api } from './api'

// 充值统计类型
interface DepositStats {
  totalDeposits: number
  totalAmount: string
  pendingDeposits: number
  completedDeposits: number
  failedDeposits: number
  todayDeposits: number
  todayAmount: string
  avgDepositAmount: string
  topCurrencies: Array<{
    currency: string
    count: number
    amount: string
  }>
}

// 充值相关的 API 服务
export const depositService = {
  // 获取充值列表
  getDeposits: async (params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
    chain_code?: string
    symbol?: string
    address?: string
    business_id?: string
    start_date?: string
    end_date?: string
  }) => {
    return api.getPaginated<Deposit>('/deposits', params)
  },

  // 获取充值详情
  getDeposit: async (id: string) => {
    return api.get<Deposit>(`/deposits/${id}`)
  },

  // 获取充值统计（接口返回 snake_case：total_deposits, total_amount 等）
  getDepositStats: async (params?: {
    time_filter?: 'day' | 'week' | 'month' | 'year'
    start_date?: string
    end_date?: string
  }) => {
    return api.get<DepositStats>('/deposits/stats', params)
  },

  // 更新充值Webhook状态
  updateDepositWebhookStatus: async (id: string, webhookSent: boolean) => {
    return api.put<void>(`/deposits/${id}/webhook`, {
      webhook_sent: webhookSent
    })
  },

  // 导出充值数据
  exportDeposits: async (params?: {
    search?: string
    status?: string
    chain_code?: string
    symbol?: string
    start_date?: string
    end_date?: string
    format?: 'csv' | 'excel'
  }) => {
    const filename = `deposits-${Date.now()}.${params?.format || 'csv'}`
    return api.download('/deposits/export', filename, {
      config: { params }
    })
  },

  // 获取充值趋势数据
  getDepositTrend: async (params?: {
    period?: 'day' | 'week' | 'month'
    currency?: string
  }) => {
    return api.get<Array<{
      date: string
      count: number
      amount: string
    }>>('/deposits/trend', {
      config: { params }
    })
  },

  // 重新发送Webhook通知
  resendWebhook: async (id: string) => {
    return api.post<void>(`/deposits/${id}/resend-webhook`)
  },

  // 搜索充值记录
  searchDeposits: async (params: {
    walletId?: string
    status?: string
    currency?: string
    dateRange?: string[]
  }) => {
    return api.get<PaginatedResponse<Deposit>>('/deposits/search', { 
      config: { params }
    })
  },
}