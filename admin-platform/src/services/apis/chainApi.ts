import { apiClient } from '../apiClient'
import type {
  Chain,
  CreateChainRequest,
  UpdateChainRequest,
  ChainListParams,
  ChainListResponse
} from '@shared/types/chain'

/**
 * 区块链网络管理API
 */
export const chainApi = {
  /**
   * 获取区块链网络列表
   */
  getChains: async (params: ChainListParams = {}): Promise<ChainListResponse> => {
    const response = await apiClient.get<ChainListResponse>('/chains', {
      params
    })
    return response.data
  },

  /**
   * 获取活跃的区块链网络
   */
  getActiveChains: async (): Promise<Chain[]> => {
    const response = await apiClient.get<Chain[]>('/chains/active')
    return response.data
  },

  /**
   * 根据ID获取区块链网络
   */
  getChain: async (id: number): Promise<Chain> => {
    const response = await apiClient.get<Chain>(`/chains/${id}`)
    return response.data
  },

  /**
   * 根据代码获取区块链网络
   */
  getChainByCode: async (code: string): Promise<Chain> => {
    const response = await apiClient.get<Chain>(`/chains/code/${code}`)
    return response.data
  },

  /**
   * 创建区块链网络
   */
  createChain: async (data: CreateChainRequest): Promise<Chain> => {
    const response = await apiClient.post<Chain>('/chains', data)
    return response.data
  },

  /**
   * 更新区块链网络
   */
  updateChain: async (id: number, data: UpdateChainRequest): Promise<Chain> => {
    const response = await apiClient.put<Chain>(`/chains/${id}`, data)
    return response.data
  },

  /**
   * 删除区块链网络
   */
  deleteChain: async (id: number): Promise<void> => {
    await apiClient.delete(`/chains/${id}`)
  },

  /**
   * 更新扫描高度
   */
  updateScanHeight: async (chainCode: string, scanHeight: number): Promise<Chain> => {
    const response = await apiClient.patch<Chain>(`/chains/${chainCode}/scan-height`, {
      height: scanHeight
    })
    return response.data
  }
}

export default chainApi
