import type {
  ColdWallet,
  ColdWalletWithBalance,
  CreateColdWalletRequest,
  WalletQueryParams, 
  WalletBalanceQueryParams
} from '@shared/types'
import { api } from './api'

// 冷钱包相关的 API 服务
export const coldWalletService = {
  /** 获取冷钱包下拉选项（id/name/address），无分页，用于归集配置等 */
  getColdWalletOptions: async (): Promise<ColdWallet[]> => {
    const response = await api.get<ColdWallet[]>('/cold-wallets/balance/options')
    return response.data ?? []
  },

  // 获取冷钱包列表（包含余额）
  getColdWallets: async (params?: WalletQueryParams) => {
    return api.getPaginated<ColdWalletWithBalance>('/cold-wallets/balance', params)
  },

  // 获取冷钱包详情
  getColdWallet: async (id: string): Promise<ColdWallet> => {
    const response = await api.get<ColdWallet>(`/cold-wallets/${id}`)
    return response.data
  },

  // 创建冷钱包
  createColdWallet: async (data: CreateColdWalletRequest): Promise<ColdWallet> => {
    const response = await api.post<ColdWallet>('/cold-wallets', data)
    return response.data
  },

  // 更新冷钱包状态（后端按整数 status 绑定）
  updateColdWalletStatus: async (id: string, data: { status: number }): Promise<ColdWallet> => {
    const response = await api.patch<ColdWallet>(`/cold-wallets/${id}/status`, data)
    return response.data
  },

  // 删除冷钱包
  deleteColdWallet: async (id: string): Promise<void> => {
    await api.delete<void>(`/cold-wallets/${id}`)
  },

  // 获取冷钱包余额列表
  getColdWalletBalances: async (params?: WalletBalanceQueryParams) => {
    return api.getPaginated<ColdWalletWithBalance>('/cold-wallets/balance', params)
  },

  // 根据地址获取冷钱包余额
  getColdWalletBalanceByAddress: async (address: string): Promise<ColdWalletWithBalance> => {
    const response = await api.get<ColdWalletWithBalance>(`/cold-wallets/balance/address/${address}`)
    return response.data
  },

  // 根据代币获取冷钱包余额
  getColdWalletBalancesByToken: async (chainCode: string, symbol: string): Promise<ColdWalletWithBalance[]> => {
    const response = await api.get<ColdWalletWithBalance[]>(`/cold-wallets/balance/token/${chainCode}/${symbol}`)
    return response.data
  },

  // 获取冷钱包统计（总钱包数、活跃钱包数、今日交易数：from/to 涉及冷钱包地址的 tenant_transactions）
  getColdWalletStats: async (): Promise<{ totalWallets: number; activeWallets: number; todayTransactions: number }> => {
    const response = await api.get<{ totalWallets: number; activeWallets: number; todayTransactions: number }>('/cold-wallets/stats')
    const d = (response as any)?.data
    return {
      totalWallets: d?.totalWallets ?? 0,
      activeWallets: d?.activeWallets ?? 0,
      todayTransactions: d?.todayTransactions ?? 0,
    }
  }
}
