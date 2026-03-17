import type {
    Transaction
} from '@shared/types'
import { api } from './api'

// 交易统计类型
interface TransactionStats {
  totalTransactions: number
  totalAmount: string
  pendingTransactions: number
  completedTransactions: number
  failedTransactions: number
  todayTransactions: number
  todayCompletedTransactions: number
  todayAmount: string
}

// 待处理交易类型
interface PendingTransaction extends Transaction {
  priority: 'low' | 'medium' | 'high'
  estimatedTime?: number
  fee?: string
}

// 交易相关的 API 服务
export const transactionService = {
  // 获取交易列表
  getTransactions: async (params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
    type?: string
    txTypeExclude?: string
    currency?: string
    walletId?: string
    address?: string
    startDate?: string
    endDate?: string
  }) => {
    return api.get<{
      transactions: Transaction[]
      pagination: { page: number; page_size: number; total: number; total_page: number }
    }>('/transactions', params)
  },

  // 获取待处理交易列表
  getPendingTransactions: async (params?: {
    page?: number
    pageSize?: number
    search?: string
    currency?: string
    walletId?: string
  }) => {
    return api.getPaginated<PendingTransaction>('/transactions/pending', params)
  },

  // 获取待处理交易统计
  getPendingTransactionStats: async () => {
    return api.get<TransactionStats>('/transactions/pending/stats')
  },

  // 获取交易详情
  getTransaction: async (id: string) => {
    return api.get<Transaction>(`/transactions/${id}`)
  },

  // 获取交易统计
  getTransactionStats: async (params?: {
    startDate?: string
    endDate?: string
    walletId?: string
  }) => {
    return api.get<TransactionStats>('/transactions/stats', params)
  },

  // 审批交易
  approveTransaction: async (transactionId: string) => {
    return api.post<Transaction>(`/transactions/${transactionId}/approve`)
  },

  // 拒绝交易
  rejectTransaction: async (transactionId: string, reason: string) => {
    return api.post<Transaction>(`/transactions/${transactionId}/reject`, { reason })
  },

  // 重试失败的交易
  retryTransaction: async (id: string) => {
    return api.post<Transaction>(`/transactions/${id}/retry`)
  },

  // 取消待处理的交易
  cancelTransaction: async (id: string) => {
    return api.post<Transaction>(`/transactions/${id}/cancel`)
  },

  // 导出交易数据
  exportTransactions: async (params?: {
    search?: string
    status?: string
    type?: string
    currency?: string
    walletId?: string
    startDate?: string
    endDate?: string
    format?: 'csv' | 'excel'
  }) => {
    const filename = `transactions-${Date.now()}.${params?.format || 'csv'}`
    return api.download('/transactions/export', filename, { config: { params } })
  },

  // 获取钱包交易记录
  getWalletTransactions: async (walletId: string, params?: {
    page?: number
    pageSize?: number
    type?: string
    status?: string
    startDate?: string
    endDate?: string
  }) => {
    return api.getPaginated<Transaction>(`/wallets/${walletId}/transactions`, params)
  },

  // 创建提现交易
  createWithdrawal: async (data: {
    walletId: string
    toAddress: string
    amount: string
    currency: string
    memo?: string
    priority?: 'low' | 'medium' | 'high'
  }) => {
    return api.post<Transaction>('/transactions/withdraw', data)
  },

  // 创建内部转账
  createInternalTransfer: async (data: {
    fromWalletId: string
    toWalletId: string
    amount: string
    currency: string
    memo?: string
  }) => {
    return api.post<Transaction>('/transactions/internal-transfer', data)
  },

  // 获取提现配置
  getWithdrawConfig: async () => {
    return api.get<{
      minAmount: string
      maxAmount: string
      fee: string
      priority: 'low' | 'normal' | 'high'
      estimatedTime: string
    }>('/transactions/withdraw/config')
  },

  // 估算提现手续费
  estimateWithdrawFee: async (data: {
    walletId: string
    toAddress: string
    amount: string
    currency: string
    priority?: 'low' | 'medium' | 'high'
  }) => {
    return api.post<{
      estimatedFee: string
      networkFee: string
      serviceFee: string
      total: string
      estimatedTime: string
    }>('/transactions/estimate-withdraw-fee', data)
  },

  // 获取交易历史趋势
  getTransactionTrend: async (params?: {
    period?: 'day' | 'week' | 'month'
    walletId?: string
    currency?: string
  }) => {
    return api.get<Array<{
      date: string
      count: number
      amount: string
    }>>('/transactions/trend', { config: { params } })
  },
}
