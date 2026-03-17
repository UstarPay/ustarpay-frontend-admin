import type {
  CreateWalletRequest,
  Transaction,
  Wallet,
  WalletBalance,
  WalletStatistics,
  WalletQueryParams,
  TransactionQueryParams,
  WalletBalanceQueryParams,
  WalletWithBalance
} from '@shared/types'
import { api } from './api'

// 钱包相关的 API 服务
export const walletService = {
  // 获取钱包列表
  getWallets: async (params?: WalletQueryParams) => {
    return api.getPaginated<WalletWithBalance>('/wallets/balances', params)
  },

  // 获取钱包详情
  getWallet: async (walletId: string) => {
    return api.get<Wallet>(`/wallets/${walletId}`)
  },

  // 创建钱包
  createWallet: async (data: CreateWalletRequest) => {
    return api.post<Wallet>('/wallets', data)
  },

  // 删除钱包
  deleteWallet: async (walletId: string) => {
    return api.delete<void>(`/wallets/${walletId}`)
  },

  // 获取钱包交易记录
  getWalletTransactions: async (walletId: string, params?: TransactionQueryParams) => {
    return api.getPaginated<Transaction>(`/wallets/${walletId}/transactions`, params)
  },

  // 获取租户钱包概览
  getTenantWalletOverview: async () => {
    return api.get<WalletStatistics>('/wallets/overview')
  },
 
  // 获取余额统计
  getBalanceStats: async () => {
    return api.get<{
      totalCurrencies: number
      activeWallets: number
      totalChange24h: number
      currencyDistribution: Record<string, number>
    }>('/wallets/balance-stats')
  },

  // 获取支持的币种列表
  getSupportedCurrencies: async () => {
    return api.get<string[]>('/wallets/currencies')
  },

  // 获取钱包余额
  getWalletBalance: async (walletId: string, currency?: string) => {
    return api.get<WalletBalance>(`/wallets/${walletId}/balance`, currency ? { currency } : undefined)
  },

  // 获取钱包统计信息
  getWalletStats: async () => {
    return api.get<{
      totalWallets: number
      hotWallets: number
      coldWallets: number
      totalBalance: string
      activeWallets: number
    }>('/wallets/stats')
  },

  // 获取地址统计信息
  getAddressStats: async () => {
    return api.get<{
      totalAddresses: number
      activeAddresses: number
      usedAddresses: number
      totalBalance: string
      averageBalance: string
    }>('/addresses/stats')
  },


  // 余额监控相关方法
  getBalanceAlerts: async (params?: WalletBalanceQueryParams) => {
    return api.getPaginated<any>('/balance-alerts', params)
  },

  createBalanceAlert: async (data: {
    walletId: string
    type: 'low' | 'high' | 'both'
    threshold?: number
    lowThreshold?: number
    highThreshold?: number
    status?: 'active' | 'inactive'
  }) => {
    return api.post<any>('/balance-alerts', data)
  },

  updateBalanceAlert: async (alertId: string, data: Partial<{
    walletId: string
    type: 'low' | 'high' | 'both'
    threshold: number
    lowThreshold: number
    highThreshold: number
    status: 'active' | 'inactive'
  }>) => {
    return api.put<any>(`/balance-alerts/${alertId}`, data)
  },

  deleteBalanceAlert: async (alertId: string) => {
    return api.delete<void>(`/balance-alerts/${alertId}`)
  },

  enableBalanceAlert: async (alertId: string) => {
    return api.post<any>(`/balance-alerts/${alertId}/enable`, {})
  },

  disableBalanceAlert: async (alertId: string) => {
    return api.post<any>(`/balance-alerts/${alertId}/disable`, {})
  },

  getMonitorConfigs: async (params?: {
    page?: number
    pageSize?: number
  }) => {
    return api.getPaginated<any>('/monitor-configs', params)
  },

  getMonitorConfigEditData: async (configId?: string) => {
    return api.get<any>('/monitor-configs/edit-data', configId ? { id: configId } : undefined)
  },

  createMonitorConfig: async (data: {
    name: string
    description?: string
    checkInterval: number
    alertChannels: string[]
    isEnabled: boolean
    recipients: Array<{ recipientId: string; channel: 'email' | 'tg' | 'discord' | 'web' }>
    novuSecretKey: string
    alertId: string // 关联的预警规则 ID（每条配置仅一个）
    workflowIdentifier?: string
  }) => {
    return api.post<any>('/monitor-configs', data)
  },

  updateMonitorConfig: async (configId: string, data: Partial<{
    name: string
    description?: string
    checkInterval: number
    alertChannels: string[]
    isEnabled: boolean
    recipients: Array<{ recipientId: string; channel: 'email' | 'tg' | 'discord' | 'web' }>
    novuSecretKey?: string
    alertId?: string
    workflowIdentifier?: string
  }>) => {
    return api.put<any>(`/monitor-configs/${configId}`, data)
  },

  deleteMonitorConfig: async (configId: string) => {
    return api.delete<void>(`/monitor-configs/${configId}`)
  },

  getBalanceMonitorStats: async () => {
    return api.get<{
      totalMonitors: number
      activeMonitors: number
      triggeredAlerts: number
      totalWallets: number
      monitoredWallets: number
      activeAlerts: number
      totalBalance: string
      averageBalance: string
    }>('/balance-monitor/stats')
  },

  // 更新钱包
  updateWallet: async (walletId: string, data: Partial<CreateWalletRequest>) => {
    return api.put<Wallet>(`/wallets/${walletId}`, data)
  },

}
