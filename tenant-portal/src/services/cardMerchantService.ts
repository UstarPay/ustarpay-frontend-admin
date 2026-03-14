import type {
  CardMerchant,
  CreateCardMerchantRequest,
  UpdateCardMerchantRequest
} from '@shared/types'
import { api } from './api'

export const cardMerchantService = {
  getCardMerchants: async (params?: { page?: number; pageSize?: number; search?: string }) => {
    return api.getPaginated<CardMerchant>('/card-merchants', params)
  },

  getCardMerchant: async (id: string): Promise<CardMerchant> => {
    const response = await api.get<CardMerchant>(`/card-merchants/${id}`)
    return response.data
  },

  createCardMerchant: async (data: CreateCardMerchantRequest): Promise<CardMerchant> => {
    const response = await api.post<CardMerchant>('/card-merchants', data)
    return response.data
  },

  updateCardMerchant: async (
    id: string,
    data: UpdateCardMerchantRequest
  ): Promise<CardMerchant> => {
    const response = await api.put<CardMerchant>(`/card-merchants/${id}`, data)
    return response.data
  },

  deleteCardMerchant: async (id: string): Promise<void> => {
    await api.delete<void>(`/card-merchants/${id}`)
  }
}
