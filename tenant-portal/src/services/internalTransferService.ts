import type {
    InternalTransfer,
    InternalTransferRequest,
    PaginatedResponse
} from '@shared/types'
import { api } from './api'

// 内部转账统计类型
interface InternalTransferStats {
  totalTransfers: number
  totalAmount: string
  pendingTransfers: number
  completedTransfers: number
  failedTransfers: number
  todayTransfers: number
  todayAmount: string
  avgTransferAmount: string
  totalFees: string
  transfersByType: Array<{
    type: string
    count: number
    amount: string
  }>
}

// 内部转账相关的 API 服务
export const internalTransferService = {
  // 获取内部转账列表
  getInternalTransfers: async (params?: {
    page?: number
    page_size?: number
    search?: string
    transfer_type?: string
    chain_code?: string
    symbol?: string
    from_address?: string
    to_address?: string
    status?: string
    start_date?: string
    end_date?: string
  }) => {
    return api.get<PaginatedResponse<InternalTransfer>>('/internal-transfers', {
      config: { params }
    })
  },

  // 获取内部转账详情
  getInternalTransfer: async (id: string) => {
    return api.get<InternalTransfer>(`/internal-transfers/${id}`)
  },

  // 创建内部转账
  createInternalTransfer: async (data: InternalTransferRequest) => {
    return api.post<InternalTransfer>('/internal-transfers', data)
  },

  // 获取内部转账统计
  getInternalTransferStats: async (params?: {
    time_filter?: 'day' | 'week' | 'month' | 'year'
    start_date?: string
    end_date?: string
  }) => {
    return api.get<InternalTransferStats>('/internal-transfers/stats', {
      config: { params }
    })
  },

  // 更新内部转账状态
  updateInternalTransferStatus: async (id: string, data: {
    status: number
    tx_hash?: string
    block_fee?: string
  }) => {
    return api.put<void>(`/internal-transfers/${id}/status`, data)
  },

  // 导出内部转账数据
  exportInternalTransfers: async (params?: {
    search?: string
    transfer_type?: string
    chain_code?: string
    symbol?: string
    status?: string
    start_date?: string
    end_date?: string
    format?: 'csv' | 'excel'
  }) => {
    const filename = `internal-transfers-${Date.now()}.${params?.format || 'csv'}`
    return api.download('/internal-transfers/export', filename, {
      config: { params }
    })
  },

  // 获取内部转账趋势数据
  getInternalTransferTrend: async (params?: {
    period?: 'day' | 'week' | 'month'
    transfer_type?: string
    currency?: string
  }) => {
    return api.get<Array<{
      date: string
      count: number
      amount: string
    }>>('/internal-transfers/trend', {
      config: { params }
    })
  },

  // 批量创建内部转账
  batchCreateInternalTransfers: async (transfers: InternalTransferRequest[]) => {
    return api.post<InternalTransfer[]>('/internal-transfers/batch', {
      transfers
    })
  },

  // 获取转账类型配置
  getTransferTypeConfig: async () => {
    return api.get<Array<{
      type: string
      name: string
      description: string
      enabled: boolean
    }>>('/internal-transfers/types')
  },

  // 验证转账地址
  validateTransferAddress: async (address: string, chainCode: string) => {
    return api.post<{
      valid: boolean
      addressType: string
      network: string
    }>('/internal-transfers/validate-address', {
      address,
      chain_code: chainCode
    })
  },

  // 获取转账统计
  getTransferStats: async () => {
    return api.get<InternalTransferStats>('/internal-transfers/stats')
  },

  // 搜索转账记录
  searchTransfers: async (params: {
    fromWalletId?: string
    toWalletId?: string
    status?: string
    currency?: string
    transferType?: string
    dateRange?: string[]
  }) => {
    return api.get<PaginatedResponse<InternalTransfer>>('/internal-transfers/search', {
      config: { params }
    })
  },
}