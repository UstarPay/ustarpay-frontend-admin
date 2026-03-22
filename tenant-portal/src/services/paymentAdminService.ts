import type {
  BinancePayOrderQueryParams,
  BinancePayOrderRecord,
  BinancePayOverview,
  BinancePayProvider,
  BinancePayProviderQueryParams,
  BinancePayWebhookEvent,
  BinancePayWebhookQueryParams,
  CreateBinancePayProviderRequest,
  UpdateBinancePayProviderRequest,
} from '@shared/types'
import { api } from './api'

const PAYMENT_BASE = '/payments/binance-pay'

export const paymentAdminService = {
  getOverview: async (): Promise<BinancePayOverview> => {
    const response = await api.get<BinancePayOverview>(`${PAYMENT_BASE}/overview`)
    return response.data
  },

  getProviders: async (params?: BinancePayProviderQueryParams) => {
    return api.getPaginated<BinancePayProvider>(`${PAYMENT_BASE}/providers`, params)
  },

  getProvider: async (id: string): Promise<BinancePayProvider> => {
    const response = await api.get<BinancePayProvider>(`${PAYMENT_BASE}/providers/${id}`)
    return response.data
  },

  createProvider: async (data: CreateBinancePayProviderRequest): Promise<BinancePayProvider> => {
    const response = await api.post<BinancePayProvider>(`${PAYMENT_BASE}/providers`, data)
    return response.data
  },

  updateProvider: async (id: string, data: UpdateBinancePayProviderRequest): Promise<BinancePayProvider> => {
    const response = await api.put<BinancePayProvider>(`${PAYMENT_BASE}/providers/${id}`, data)
    return response.data
  },

  deleteProvider: async (id: string): Promise<void> => {
    await api.delete(`${PAYMENT_BASE}/providers/${id}`)
  },

  getOrders: async (params?: BinancePayOrderQueryParams) => {
    return api.getPaginated<BinancePayOrderRecord>(`${PAYMENT_BASE}/orders`, params)
  },

  getWebhookEvents: async (params?: BinancePayWebhookQueryParams) => {
    return api.getPaginated<BinancePayWebhookEvent>(`${PAYMENT_BASE}/webhook-events`, params)
  },
}
