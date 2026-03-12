import type { Currency, CurrencyListParams } from '@shared/types/currency'
import { api } from './api'

// 代币管理相关的 API 服务
export const currencyService = {
  // 获取代币列表
  getCurrencies: async (params?: CurrencyListParams) => {
    return api.getPaginated<Currency>('/currencies', params)
  },

  // 获取原生币种
  getNativeCurrencies: async () => {
    return api.get<Currency[]>('/currencies/native')
  },

  // 获取活跃的代币
  getActiveCurrencies: async (chainCode?: string) => {
    if (chainCode) {
      return api.get<Currency[]>(`/currencies/chain/${chainCode}/active`)
    }
    return api.get<Currency[]>('/currencies/active')
  },

  // 根据链代码获取代币
  getCurrenciesByChain: async (chainCode: string) => {
    return api.get<Currency[]>(`/currencies/chain/${chainCode}`)
  },

  // 根据符号获取代币
  getCurrencyBySymbol: async (chainCode: string, symbol: string) => {
    return api.get<Currency>(`/currencies/chain/${chainCode}/symbol/${symbol}`)
  },

  // 根据合约地址获取代币
  getCurrencyByContract: async (chainCode: string, contractAddress: string) => {
    return api.get<Currency>(`/currencies/chain/${chainCode}/contract/${contractAddress}`)
  },

  // 根据ID获取代币
  getCurrency: async (id: string) => {
    return api.get<Currency>(`/currencies/${id}`)
  }
} 