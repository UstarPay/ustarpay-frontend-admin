import type {
  CardAccountFlow,
  CardFeeConfig,
  PhysicalCardApplication,
  PhysicalCardInventory,
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
  },

  getPhysicalInventories: async (params?: { page?: number; pageSize?: number; search?: string; status?: number }) => {
    return api.getPaginated<PhysicalCardInventory>('/cards/physical-inventories', params)
  },

  getPrebuiltInventorySwitch: async (): Promise<{ enabled: boolean }> => {
    const response = await api.get<{ enabled: boolean }>('/cards/physical-inventories/switch')
    return response.data
  },

  updatePrebuiltInventorySwitch: async (enabled: boolean): Promise<void> => {
    await api.put<void>('/cards/physical-inventories/switch', { enabled })
  },

  getPhysicalApplications: async (params?: { page?: number; pageSize?: number; search?: string; status?: number }) => {
    return api.getPaginated<PhysicalCardApplication>('/cards/physical-applications', params)
  },

  downloadPhysicalInventoryTemplate: async (): Promise<void> => {
    await api.download('/cards/physical-inventories/import-template', 'prebuilt-physical-card-import-template.csv')
  },

  importPhysicalInventories: async (file: File): Promise<void> => {
    await api.upload<void>('/tenant-admin/v1/cards/physical-inventories/import', file)
  },

  approvePhysicalApplication: async (id: string, payload: { inventoryId: string; remark?: string }) => {
    await api.post<void>(`/cards/physical-applications/${id}/approve`, payload)
  },

  rejectPhysicalApplication: async (id: string, payload: { rejectReason: string; remark?: string }) => {
    await api.post<void>(`/cards/physical-applications/${id}/reject`, payload)
  },

  updatePhysicalApplicationShipment: async (id: string, payload: { courierVendor: string; trackingNo: string; remark?: string }) => {
    await api.post<void>(`/cards/physical-applications/${id}/shipment`, payload)
  }
}
