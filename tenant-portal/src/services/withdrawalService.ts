import type {
    PaginatedResponse,
    Withdrawal,
    WithdrawalFeeEstimate,
    WithdrawalRequest
} from '@shared/types'
import { api } from './api'

// 提现统计类型
interface WithdrawalStats {
  totalWithdrawals: number
  totalAmount: string
  pendingWithdrawals: number
  frozenPendingWithdrawals: number
  frozenPendingAmount: string
  processingWithdrawals: number
  completedWithdrawals: number
  failedWithdrawals: number
  cancelledWithdrawals: number
  todayWithdrawals: number
  todayAmount: string
  avgWithdrawalAmount: string
  totalFees: string
  topCurrencies: Array<{
    currency: string
    count: number
    amount: string
  }>
}

// 提现相关的 API 服务
export const withdrawalService = {
  // 获取提现列表
  getWithdrawals: async (params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
    statuses?: string
    include_transaction_status?: string
    chain_code?: string
    symbol?: string
    address?: string
    business_id?: string
    start_date?: string
    end_date?: string
  }) => {
    return api.getPaginated<Withdrawal>('/withdrawals', params)
  },

  // 获取提现详情
  getWithdrawal: async (id: string) => {
    return api.get<Withdrawal>(`/withdrawals/${id}`)
  },

  // 创建提现申请
  createWithdrawal: async (data: WithdrawalRequest) => {
    return api.post<Withdrawal>('/withdrawals', data)
  },

  // 获取提现统计
  getWithdrawalStats: async (params?: {
    time_filter?: 'day' | 'week' | 'month' | 'year'
    start_date?: string
    end_date?: string
  }) => {
    return api.get<WithdrawalStats>('/withdrawals/stats', params)
  },

  // 估算提现手续费
  estimateWithdrawalFee: async (data: {
    chain_code: string
    symbol: string
    amount: string
    priority?: 'low' | 'normal' | 'high'
  }) => {
    return api.post<WithdrawalFeeEstimate>('/withdrawals/estimate-fee', data)
  },

  // 更新提现状态
  updateWithdrawalStatus: async (id: string, data: {
    status: number
    failure_reason?: string
    tx_hash?: string
  }) => {
    return api.put<void>(`/withdrawals/${id}/status`, data)
  },

  // 取消提现
  cancelWithdrawal: async (id: string) => {
    return api.put<void>(`/withdrawals/${id}/cancel`)
  },

  // 导出提现数据
  exportWithdrawals: async (params?: {
    search?: string
    status?: string
    chain_code?: string
    symbol?: string
    start_date?: string
    end_date?: string
    format?: 'csv' | 'excel'
  }) => {
    const filename = `withdrawals-${Date.now()}.${params?.format || 'csv'}`
    return api.download('/withdrawals/export', filename, {
      config: { params }
    })
  },

  // 获取提现趋势数据
  getWithdrawalTrend: async (params?: {
    period?: 'day' | 'week' | 'month'
    currency?: string
  }) => {
    return api.get<Array<{
      date: string
      count: number
      amount: string
    }>>('/withdrawals/trend', params)
  },

  // 批量更新提现状态
  batchUpdateStatus: async (ids: string[], status: number) => {
    return api.put<void>('/withdrawals/batch-status', {
      ids,
      status
    })
  },

  // 获取提现配置
  getWithdrawConfig: async () => {
    return api.get<{
      minAmount: string
      maxAmount: string
      dailyLimit: string
      requiredConfirmations: number
      supportedCurrencies: string[]
    }>('/withdrawals/config')
  },

  // 获取可用余额（按链/币种，用于提现表单校验与展示）
  getAvailableBalance: async (params?: { chain_code?: string; symbol?: string }) => {
    return api.get<{ balance: string; symbol?: string }>('/withdrawals/available-balance', params)
  },

  // 搜索提现记录
  searchWithdrawals: async (params: {
    walletId?: string
    status?: string
    currency?: string
    dateRange?: string[]
  }) => {
    return api.get<PaginatedResponse<Withdrawal>>('/withdrawals/search', params)
  },
}
