import { api } from './api'

export interface WithdrawalRiskConfig {
  id: string
  tenantId: string
  chainCode: string
  symbol: string
  singleLimit: string
  dailyLimit: string
  dailyTxCountLimit: number
  kycCooldownHours: number
  userFrequencyLimitMins: number
  requireApproval: boolean
  riskLevel: number
  status: number
  createdAt: string
  updatedAt: string
}

export interface UpsertRiskConfigRequest {
  chainCode: string
  symbol: string
  singleLimit: string | number
  dailyLimit: string | number
  dailyTxCountLimit?: number
  kycCooldownHours?: number
  userFrequencyLimitMins?: number
  requireApproval: boolean
}

export const withdrawalRiskConfigService = {
  listRiskConfigs: async (params?: {
    chainCodes?: string[]
    symbols?: string[]
  }): Promise<WithdrawalRiskConfig[]> => {
    const response = await api.get<WithdrawalRiskConfig[]>(
      '/withdrawal-risk-configs',
      params
    )
    return response.data ?? []
  },

  getRiskConfig: async (
    chainCode: string,
    symbol: string
  ): Promise<WithdrawalRiskConfig | null> => {
    const response = await api.get<WithdrawalRiskConfig | null>(
      `/withdrawal-risk-configs/${chainCode}/${symbol}`
    )
    return response.data
  },

  upsertRiskConfig: async (data: UpsertRiskConfigRequest): Promise<void> => {
    await api.put('/withdrawal-risk-configs', data)
  },

  deleteRiskConfig: async (chainCode: string, symbol: string): Promise<void> => {
    await api.delete(`/withdrawal-risk-configs/${chainCode}/${symbol}`)
  },
}
