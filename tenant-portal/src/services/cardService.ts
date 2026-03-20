import type {
  CardAccountFlow,
  CardFeeConfig,
  CardRecord,
  CardReconcileDiff,
  CardSettlementBatch,
  CardTransaction,
} from '@shared/types'
import { api } from './api'

export const cardService = {
  getCards: async (params?: { page?: number; pageSize?: number; search?: string }) => {
    return api.getPaginated<CardRecord>('/cards', params)
  },

  getCardTransactions: async (params?: { page?: number; pageSize?: number; search?: string; status?: string; type?: string; reconcileStatus?: string; batchId?: string; userId?: string }) => {
    return api.getPaginated<CardTransaction>('/cards/transactions', params)
  },

  getCardAccountFlows: async (params?: { page?: number; pageSize?: number; search?: string; flowType?: string; currency?: string; userId?: string }) => {
    return api.getPaginated<CardAccountFlow>('/cards/account-flows', params)
  },

  getCardFundFlows: async (params?: { page?: number; pageSize?: number; search?: string; changeType?: string; status?: string; userId?: string }) => {
    return api.get<{
      items: any[]
      pagination: { page: number; pageSize: number; total: number; totalPages: number }
    }>('/cards/fund-flows', { ...params, bizType: 'card_consume' })
  },

  getSettlementBatches: async (params?: { page?: number; pageSize?: number; search?: string; status?: string; currency?: string }) => {
    return api.getPaginated<CardSettlementBatch>('/cards/settlement-batches', params)
  },

  getReconcileDiffs: async (params?: { page?: number; pageSize?: number; search?: string; status?: string; diffType?: string }) => {
    return api.getPaginated<CardReconcileDiff>('/cards/reconcile-diffs', params)
  },

  resolveReconcileDiff: async (id: string, note: string): Promise<void> => {
    await api.post<void>(`/cards/reconcile-diffs/${id}/resolve`, { note })
  },

  getFeeConfig: async (): Promise<CardFeeConfig> => {
    const response = await api.get<CardFeeConfig>('/cards/fee-config')
    return response.data
  },

  updateFeeConfig: async (config: CardFeeConfig): Promise<void> => {
    await api.put<void>('/cards/fee-config', { configValue: config })
  }
}
