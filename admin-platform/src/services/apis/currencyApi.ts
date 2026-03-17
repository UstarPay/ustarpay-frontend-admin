import { apiClient } from '../apiClient'
import type {
  Currency,
  CreateCurrencyRequest,
  UpdateCurrencyRequest,
  CurrencyListParams,
  CurrencyListResponse
} from '@shared/types/currency'

/**
 * 代币/币种管理API
 */
export const currencyApi = {
  /**
   * 获取代币列表
   */
  getCurrencies: async (params: CurrencyListParams = {}): Promise<CurrencyListResponse> => {
    const response = await apiClient.get<CurrencyListResponse>('/currencies', {
      params
    })
    return response.data
  },

  /**
   * 获取原生币种
   */
  getNativeCurrencies: async (): Promise<Currency[]> => {
    const response = await apiClient.get<Currency[]>('/currencies/native')
    return response.data
  },

  /**
   * 获取活跃的代币
   */
  getActiveCurrencies: async (): Promise<Currency[]> => {
    const response = await apiClient.get<Currency[]>('/')
    return response.data
  },

  /**
   * 根据链代码获取代币
   */
  getCurrenciesByChain: async (chainCode: string): Promise<Currency[]> => {
    const response = await apiClient.get<Currency[]>(`/currencies/chain/${chainCode}`)
    return response.data
  },

  /**
   * 根据符号获取代币
   */
  getCurrencyBySymbol: async (symbol: string): Promise<Currency> => {
    const response = await apiClient.get<Currency>(`/currencies/symbol/${symbol}`)
    return response.data
  },

  /**
   * 根据合约地址获取代币
   */
  getCurrencyByContract: async (chainCode: string, contractAddress: string): Promise<Currency> => {
    const response = await apiClient.get<Currency>(`/currencies/contract/${chainCode}/${contractAddress}`)
    return response.data
  },

  /**
   * 根据ID获取代币
   */
  getCurrency: async (id: number): Promise<Currency> => {
    const response = await apiClient.get<Currency>(`/currencies/${id}`)
    return response.data
  },

  /**
   * 创建代币
   */
  createCurrency: async (data: CreateCurrencyRequest): Promise<Currency> => {
    const response = await apiClient.post<Currency>('/currencies', data)
    return response.data
  },

  /**
   * 更新代币
   */
  updateCurrency: async (id: number, data: UpdateCurrencyRequest): Promise<Currency> => {
    const response = await apiClient.put<Currency>(`/currencies/${id}`, data)
    return response.data
  },

  /**
   * 删除代币
   */
  deleteCurrency: async (id: number): Promise<void> => {
    await apiClient.delete(`/currencies/${id}`)
  }
}

export default currencyApi
