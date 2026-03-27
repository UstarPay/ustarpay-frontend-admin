import { apiClient } from '../apiClient'
import type {
  CardMerchant,
  CardWebhookMockCardInfo,
  CardWebhookMockSubmitRequest,
  CardWebhookMockSubmitResponse,
  CreateCardMerchantRequest,
  UpdateCardMerchantRequest,
  PaginatedResponse,
} from '@shared/types'

export const cardMerchantApi = {
  getCardMerchants: async (params?: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResponse<CardMerchant>> => {
    const response = await apiClient.get<PaginatedResponse<CardMerchant>>('/tenants/card-merchants', { params })
    return response.data
  },

  getCardMerchant: async (id: string): Promise<CardMerchant> => {
    const response = await apiClient.get<CardMerchant>(`/tenants/card-merchants/${id}`)
    return response.data
  },

  createCardMerchant: async (data: CreateCardMerchantRequest): Promise<CardMerchant> => {
    const response = await apiClient.post<CardMerchant>('/tenants/card-merchants', data)
    return response.data
  },

  updateCardMerchant: async (id: string, data: UpdateCardMerchantRequest): Promise<CardMerchant> => {
    const response = await apiClient.put<CardMerchant>(`/tenants/card-merchants/${id}`, data)
    return response.data
  },

  deleteCardMerchant: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenants/card-merchants/${id}`)
  },

  getWebhookMockCard: async (cardId: string): Promise<CardWebhookMockCardInfo> => {
    const response = await apiClient.get<CardWebhookMockCardInfo>(`/tenants/card-merchants/webhook-mocks/cards/${encodeURIComponent(cardId)}`)
    return response.data
  },

  submitWebhookMock: async (data: CardWebhookMockSubmitRequest): Promise<CardWebhookMockSubmitResponse> => {
    const response = await apiClient.post<CardWebhookMockSubmitResponse>('/tenants/card-merchants/webhook-mocks', data)
    return response.data
  },
}
