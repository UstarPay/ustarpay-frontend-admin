import { apiClient } from '@/services/apiClient'

export interface SumsubConfigView {
  appToken: string
  appTokenConfigured: boolean
  secretKey: string
  secretKeyConfigured: boolean
  baseUrl: string
  sandboxEnabled: boolean
  l2LevelName: string
  webhookSecret: string
  webhookSecretConfigured: boolean
  websdkTtlSecs: number
}

export interface UpdateSumsubConfigPayload {
  appToken?: string
  secretKey?: string
  baseUrl: string
  sandboxEnabled: boolean
  l2LevelName: string
  webhookSecret?: string
  websdkTtlSecs: number
}

export const sumsubConfigApi = {
  async getConfig(): Promise<SumsubConfigView> {
    const response = await apiClient.get<SumsubConfigView>('/system/sumsub-config')
    return response.data
  },

  async updateConfig(payload: UpdateSumsubConfigPayload): Promise<SumsubConfigView> {
    const response = await apiClient.put<SumsubConfigView>('/system/sumsub-config', payload)
    return response.data
  },
}
