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
  environmentTag: string
  webhookForwardEnabled: boolean
  showEnvironmentTagEditor: boolean
  showForwardTargetModule: boolean
  showWebhookForwardToggle: boolean
  fixedEnvironmentTag: string
}

export interface UpdateSumsubConfigPayload {
  appToken?: string
  secretKey?: string
  baseUrl: string
  sandboxEnabled: boolean
  l2LevelName: string
  webhookSecret?: string
  websdkTtlSecs: number
  environmentTag?: string
  webhookForwardEnabled?: boolean
}

export interface SumsubForwardTargetView {
  id: string
  name: string
  enabled: boolean
  environmentTag: string
  matchType: string
  matchValue?: string
  targetUrl: string
  sharedSecretConfigured: boolean
  timeoutSeconds: number
  silentOnFailure: boolean
  lastHeartbeatAt?: string
  lastTestedAt?: string
  lastForwardedAt?: string
  lastErrorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface SumsubForwardTargetPayload {
  name: string
  enabled: boolean
  environmentTag: string
  matchType: string
  matchValue?: string
  targetUrl: string
  sharedSecret?: string
  timeoutSeconds: number
  silentOnFailure: boolean
}

export interface SumsubForwardActionResult {
  success: boolean
  statusCode?: number
  durationMs?: number
  message: string
  eventKey?: string
  targetUrl?: string
  testPayload?: boolean
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

  async listForwardTargets(): Promise<SumsubForwardTargetView[]> {
    const response = await apiClient.get<SumsubForwardTargetView[]>('/system/sumsub/webhook-forward-targets')
    return response.data
  },

  async createForwardTarget(payload: SumsubForwardTargetPayload): Promise<SumsubForwardTargetView> {
    const response = await apiClient.post<SumsubForwardTargetView>('/system/sumsub/webhook-forward-targets', payload)
    return response.data
  },

  async updateForwardTarget(id: string, payload: SumsubForwardTargetPayload): Promise<SumsubForwardTargetView> {
    const response = await apiClient.put<SumsubForwardTargetView>(`/system/sumsub/webhook-forward-targets/${id}`, payload)
    return response.data
  },

  async enableForwardTarget(id: string): Promise<SumsubForwardTargetView> {
    const response = await apiClient.post<SumsubForwardTargetView>(`/system/sumsub/webhook-forward-targets/${id}/enable`, {})
    return response.data
  },

  async disableForwardTarget(id: string): Promise<SumsubForwardTargetView> {
    const response = await apiClient.post<SumsubForwardTargetView>(`/system/sumsub/webhook-forward-targets/${id}/disable`, {})
    return response.data
  },

  async testForwardTarget(id: string): Promise<SumsubForwardActionResult> {
    const response = await apiClient.post<SumsubForwardActionResult>(`/system/sumsub/webhook-forward-targets/${id}/test`, {})
    return response.data
  },

  async replayForwardTarget(id: string, eventKey?: string): Promise<SumsubForwardActionResult> {
    const response = await apiClient.post<SumsubForwardActionResult>(
      `/system/sumsub/webhook-forward-targets/${id}/replay`,
      eventKey ? { eventKey } : {}
    )
    return response.data
  },
}
