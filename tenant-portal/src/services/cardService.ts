import type { CardRecord, CardFeeConfig } from '@shared/types'
import type { CardTransaction } from '@shared/types'
import { api } from './api'

export const cardService = {
  getCards: async (params?: { page?: number; pageSize?: number; search?: string }) => {
    return api.getPaginated<CardRecord>('/cards', params)
  },

  getCardTransactions: async (params?: { page?: number; pageSize?: number; search?: string }) => {
    return api.getPaginated<CardTransaction>('/cards/transactions', params)
  },

  getFeeConfig: async (): Promise<CardFeeConfig> => {
    const response = await api.get<CardFeeConfig>('/cards/fee-config')
    return response.data
  },

  updateFeeConfig: async (config: CardFeeConfig): Promise<void> => {
    await api.put<void>('/cards/fee-config', { configValue: config })
  }
}
