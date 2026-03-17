import type { Chain, ChainListParams } from '@shared/types/chain'
import { api } from './api'

// 区块链网络管理相关的 API 服务
export const chainService = {
  // 获取区块链网络列表
  getChains: async (params?: ChainListParams) => {
    return api.getPaginated<Chain>('/chains', params)
  },

  // 获取活跃的区块链网络
  getActiveChains: async () => {
    return api.getPaginated<Chain>('/chains/active')
  },

  // 根据ID获取区块链网络
  getChain: async (id: string) => {
    return api.get<Chain>(`/chains/${id}`)
  },

  // 根据代码获取区块链网络
  getChainByCode: async (code: string) => {
    return api.get<Chain>(`/chains/code/${code}`)
  }
} 