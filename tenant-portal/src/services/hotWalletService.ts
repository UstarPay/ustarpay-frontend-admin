import type {
  HotWallet,
  HotWalletWithBalance,
  HotWalletStats,
  CreateHotWalletRequest,
  UpdateHotWalletRequest,
  UpdateHotWalletStatusRequest,
  WalletQueryParams,
  WalletBalanceQueryParams,
  PaginatedResponse
} from '@shared/types'
import { api } from './api'

// 热钱包相关的 API 服务
export const hotWalletService = {
 
  /** 获取热钱包下拉选项（id/name/address），无分页，用于预警规则等 */
  getHotWalletOptions: async (): Promise<HotWallet[]> => {
    const response = await api.get<HotWallet[]>('/hot-wallets/balance/options')
    return response.data ?? []
  },

  // 获取热钱包列表（包含余额）
  getHotWallets: async (params?: WalletQueryParams) => {
    return api.getPaginated<HotWalletWithBalance>('/hot-wallets/balance', params)
  },

  // 获取热钱包详情
  getHotWallet: async (id: string): Promise<HotWallet> => {
    const response = await api.get<HotWallet>(`/hot-wallets/${id}`)
    return response.data
  },

  // 创建热钱包
  createHotWallet: async (data: CreateHotWalletRequest): Promise<HotWallet> => {
    const response = await api.post<HotWallet>('/hot-wallets', data)
    return response.data
  },

  // 更新热钱包（描述、提现钱包、Gas钱包、状态）
  updateHotWallet: async (id: string, data: UpdateHotWalletRequest): Promise<HotWallet> => {
    const response = await api.put<HotWallet>(`/hot-wallets/${id}`, data)
    return response.data
  },

  // 更新热钱包状态（保留兼容，建议使用 updateHotWallet）
  updateHotWalletStatus: async (id: string, data: UpdateHotWalletStatusRequest): Promise<HotWallet> => {
    const response = await api.patch<HotWallet>(`/hot-wallets/${id}/status`, data)
    return response.data
  },

  // 获取热钱包余额列表
  getHotWalletBalances: async (params?: WalletQueryParams) => {
    return api.getPaginated<HotWalletWithBalance>('/hot-wallets/balance', params)
  },

  // 根据地址获取热钱包余额
  getHotWalletBalanceByAddress: async (address: string): Promise<HotWalletWithBalance> => {
    const response = await api.get<HotWalletWithBalance>(`/hot-wallets/balance/address/${address}`)
    return response.data
  },

  // 根据代币获取热钱包余额
  getHotWalletBalancesByToken: async (chainCode: string, symbol: string): Promise<HotWalletWithBalance[]> => {
    const response = await api.get<HotWalletWithBalance[]>(`/hot-wallets/balance/token/${chainCode}/${symbol}`)
    return response.data
  },

  // 获取热钱包统计
  getHotWalletStats: async (): Promise<HotWalletStats> => {
    const response = await api.get<HotWalletStats>('/hot-wallets/stats')
    return response.data
  },

  // 删除热钱包（如果需要的话）
  deleteHotWallet: async (id: string): Promise<void> => {
    await api.delete<void>(`/hot-wallets/${id}`)
  }
}
